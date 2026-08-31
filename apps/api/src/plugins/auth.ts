import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ACCESS_COOKIE, verifyAccessToken } from "../lib/auth";
import { Fa, permissionDeniedMessage } from "../lib/errors";

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(cookie);

  app.decorateRequest("auth", undefined);
  app.decorateRequest("user", undefined);

  app.addHook("preHandler", async (request) => {
    const token =
      request.cookies?.[ACCESS_COOKIE] ||
      (request.headers.authorization?.startsWith("Bearer ")
        ? request.headers.authorization.slice(7)
        : undefined);
    if (!token) return;
    try {
      request.auth = await verifyAccessToken(token);
    } catch {
      request.auth = undefined;
    }
  });
});

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth?.sub) {
    return reply.unauthorized(Fa.unauthorized);
  }
  const user = await request.server.prisma.user.findUnique({
    where: { id: request.auth.sub },
    include: { role: true },
  });
  if (!user) {
    return reply.unauthorized(Fa.userNotFound);
  }
  request.user = user;
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) return;
  if (!request.user?.roleId) {
    return reply.forbidden(Fa.adminRequired);
  }
}

export function requirePermission(
  entity: string,
  action: "create" | "update" | "delete" | "read"
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;
    const permissions = (request.user?.role?.permissions ?? []) as Array<{
      entity?: string;
      actions?: string[];
    }>;
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return reply.forbidden(permissionDeniedMessage(entity, action));
    }
    const rule = permissions.find((p) => p.entity === entity || p.entity === "*");
    if (!rule || !(rule.actions ?? []).includes(action)) {
      return reply.forbidden(permissionDeniedMessage(entity, action));
    }
  };
}
