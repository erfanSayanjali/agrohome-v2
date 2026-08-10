import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { ok, okList, parseListQuery, prismaOrderBy } from "./helpers";
import { Fa, mapPrismaError, toPersianMessage } from "./errors";
import { requireAdmin, requirePermission } from "../plugins/auth";

type CrudOptions = {
  entity: string;
  searchFields?: string[];
  include?: Record<string, unknown>;
  mapCreate?: (body: Record<string, unknown>) => Record<string, unknown>;
  mapUpdate?: (body: Record<string, unknown>) => Record<string, unknown>;
  beforeDelete?: (app: FastifyInstance, id: string) => Promise<void>;
  /** فعال‌سازی PUT /admin/{path}/reorder برای sortOrder */
  sortable?: boolean;
};

function getDelegate(prisma: PrismaClient, model: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[model];
  if (!delegate) throw new Error(`Unknown prisma model: ${model}`);
  return delegate;
}

export function registerAdminCrud(
  app: FastifyInstance,
  path: string,
  model: string,
  options: CrudOptions
) {
  const base = `/admin/${path}`;

  app.get(base, { preHandler: [requireAdmin] }, async (request) => {
    const q = parseListQuery(request.query as Record<string, unknown>);
    const where: Record<string, unknown> = { ...q.filters };
    if (q.search && options.searchFields?.length) {
      where.OR = options.searchFields.map((field) => ({
        [field]: { contains: q.search, mode: "insensitive" },
      }));
    }
    const delegate = getDelegate(app.prisma, model);
    const total = await delegate.count({ where });
    if (q.fieldsMetaOnly || q.limit === 0) {
      return okList([], total, q.page, q.limit);
    }
    const content = await delegate.findMany({
      where,
      orderBy: prismaOrderBy(q.sort),
      skip: q.skip,
      take: q.limit,
      include: options.include,
    });
    return okList(content, total, q.page, q.limit);
  });

  // قبل از /:id ثبت شود تا «reorder» به‌عنوان id گرفته نشود
  if (options.sortable) {
    app.put(
      `${base}/reorder`,
      { preHandler: [requirePermission(options.entity, "update")] },
      async (request) => {
        const { items } = (request.body ?? {}) as {
          items?: Array<{ id: string; sortOrder: number }>;
        };
        if (!items?.length) return ok([]);
        const delegate = getDelegate(app.prisma, model);
        await app.prisma.$transaction(
          items.map((item) =>
            delegate.update({
              where: { id: item.id },
              data: { sortOrder: item.sortOrder },
            })
          )
        );
        return ok(items);
      }
    );
  }

  app.get(`${base}/:id`, { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await getDelegate(app.prisma, model).findUnique({
      where: { id },
      include: options.include,
    });
    if (!item) return reply.notFound(Fa.notFound);
    return ok(item);
  });

  app.post(
    base,
    { preHandler: [requirePermission(options.entity, "create")] },
    async (request, reply) => {
      try {
        const body = (request.body ?? {}) as Record<string, unknown>;
        const data = options.mapCreate ? options.mapCreate(body) : body;
        const item = await getDelegate(app.prisma, model).create({
          data,
          include: options.include,
        });
        return ok(item);
      } catch (err) {
        const mapped = mapPrismaError(err);
        if (mapped) {
          return reply.status(mapped.statusCode).send({
            statusCode: mapped.statusCode,
            error: mapped.statusCode === 409 ? "Conflict" : "Bad Request",
            message: mapped.message,
          });
        }
        app.log.error(err);
        return reply.internalServerError(Fa.createFailed);
      }
    }
  );

  app.put(
    `${base}/:id`,
    { preHandler: [requirePermission(options.entity, "update")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data = options.mapUpdate ? options.mapUpdate(body) : body;
      try {
        const item = await getDelegate(app.prisma, model).update({
          where: { id },
          data,
          include: options.include,
        });
        return ok(item);
      } catch (err) {
        const mapped = mapPrismaError(err);
        if (mapped) {
          return reply.status(mapped.statusCode).send({
            statusCode: mapped.statusCode,
            error: mapped.statusCode === 404 ? "Not Found" : "Bad Request",
            message: mapped.message,
          });
        }
        return reply.notFound(Fa.recordNotFound);
      }
    }
  );

  app.delete(
    `${base}/:id`,
    { preHandler: [requirePermission(options.entity, "delete")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        if (options.beforeDelete) {
          await options.beforeDelete(app, id);
        }
        await getDelegate(app.prisma, model).delete({ where: { id } });
        return ok({ id });
      } catch (err) {
        if (reply.sent) return;
        const mapped = mapPrismaError(err);
        if (mapped) {
          return reply.status(mapped.statusCode).send({
            statusCode: mapped.statusCode,
            error: "Bad Request",
            message: mapped.message,
          });
        }
        const message = err instanceof Error ? err.message : Fa.deleteFailed;
        const persian = toPersianMessage(message);
        if (
          message.includes("children") ||
          message.includes("badRequest") ||
          /[\u0600-\u06FF]/.test(persian)
        ) {
          return reply.badRequest(persian);
        }
        return reply.notFound(Fa.recordNotFound);
      }
    }
  );
}
