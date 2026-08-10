import path from "node:path";
import { mkdir } from "node:fs/promises";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";
import { authPlugin } from "./plugins/auth";
import { prismaPlugin } from "./plugins/prisma";
import { errorPlugin } from "./plugins/errors";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { adminCatalogRoutes } from "./routes/admin/catalog";
import { adminBlogRoutes } from "./routes/admin/blog";
import { adminCmsRoutes } from "./routes/admin/cms";
import { adminMiscRoutes } from "./routes/admin/misc";
import { publicRoutes } from "./routes/public/index";

export async function buildApp(
  app: FastifyInstance,
  options: { rootDir: string }
) {
  const uploadsDir = path.join(options.rootDir, "uploads");
  await mkdir(uploadsDir, { recursive: true });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(sensible);
  await app.register(errorPlugin);
  await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: "/uploads/",
    decorateReply: false,
  });

  await app.register(healthRoutes);
  await app.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(publicRoutes);
      await api.register(adminCatalogRoutes);
      await api.register(adminBlogRoutes);
      await api.register(adminCmsRoutes);
      await api.register(
        async function miscPlugin(instance) {
          await adminMiscRoutes(instance, uploadsDir);
        },
        { prefix: "" }
      );
    },
    { prefix: "/api/v1" }
  );

  return app;
}
