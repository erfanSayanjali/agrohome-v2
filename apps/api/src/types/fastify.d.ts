import type { PrismaClient, Role, User } from "@prisma/client";
import type { JwtPayload } from "../lib/auth";

export type AuthUser = User & { role: Role | null };

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }

  interface FastifyRequest {
    auth?: JwtPayload;
    user?: AuthUser;
  }
}
