import type { FastifyInstance } from "fastify";
import {
  ACCESS_COOKIE,
  generateOtpCode,
  hashOtp,
  hashPassword,
  otpExpiresAt,
  signAccessToken,
  verifyPassword,
} from "../lib/auth";
import { isIranMobile, ok } from "../lib/helpers";
import { Fa } from "../lib/errors";
import { requireAuth } from "../plugins/auth";

function setAuthCookie(reply: { setCookie: Function }, token: string) {
  reply.setCookie(ACCESS_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/check-phone", async (request, reply) => {
    const { phone } = (request.body ?? {}) as { phone?: string };
    if (!phone || !isIranMobile(phone)) {
      return reply.badRequest(Fa.invalidPhone);
    }
    const user = await app.prisma.user.findUnique({ where: { phone } });
    return ok({
      exists: Boolean(user),
      flow: user ? "login" : "register",
    });
  });

  app.post("/auth/request-otp", async (request, reply) => {
    const { phone } = (request.body ?? {}) as { phone?: string };
    if (!phone || !isIranMobile(phone)) {
      return reply.badRequest(Fa.invalidPhone);
    }
    const code = generateOtpCode();
    const expiresAt = otpExpiresAt();
    await app.prisma.otpChallenge.create({
      data: {
        phone,
        codeHash: hashOtp(code),
        expiresAt,
      },
    });
    app.log.info({ phone, code, expiresAt }, "[OTP] verification code (dev log)");
    console.log(`[OTP] phone=${phone} code=${code} expiresAt=${expiresAt.toISOString()}`);
    return ok({ sent: true, expiresInSec: 300 });
  });

  app.post("/auth/verify-otp", async (request, reply) => {
    const body = (request.body ?? {}) as {
      phone?: string;
      code?: string;
      firstName?: string;
      lastName?: string;
    };
    if (!body.phone || !isIranMobile(body.phone) || !body.code) {
      return reply.badRequest(Fa.phoneAndCodeRequired);
    }
    const challenge = await app.prisma.otpChallenge.findFirst({
      where: {
        phone: body.phone,
        consumed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge || challenge.codeHash !== hashOtp(body.code)) {
      return reply.unauthorized(Fa.invalidOtp);
    }
    await app.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumed: true },
    });

    let user = await app.prisma.user.findUnique({
      where: { phone: body.phone },
      include: { role: true },
    });
    if (!user) {
      user = await app.prisma.user.create({
        data: {
          phone: body.phone,
          firstName: body.firstName,
          lastName: body.lastName,
        },
        include: { role: true },
      });
    }

    const token = await signAccessToken({
      sub: user.id,
      phone: user.phone,
      roleId: user.roleId,
    });
    setAuthCookie(reply, token);
    return ok({
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        role: user.role,
      },
      isAdmin: Boolean(user.roleId),
    });
  });

  app.post("/auth/login-password", async (request, reply) => {
    const { phone, password } = (request.body ?? {}) as {
      phone?: string;
      password?: string;
    };
    if (!phone || !password || !isIranMobile(phone)) {
      return reply.badRequest(Fa.phoneAndPasswordRequired);
    }
    const user = await app.prisma.user.findUnique({
      where: { phone },
      include: { role: true },
    });
    if (!user?.passwordHash || !user.roleId) {
      return reply.unauthorized(Fa.invalidCredentials);
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return reply.unauthorized(Fa.invalidCredentials);

    const token = await signAccessToken({
      sub: user.id,
      phone: user.phone,
      roleId: user.roleId,
    });
    setAuthCookie(reply, token);
    return ok({
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        role: user.role,
      },
      isAdmin: true,
    });
  });

  app.get("/auth/me", { preHandler: [requireAuth] }, async (request) => {
    return ok({
      id: request.user!.id,
      phone: request.user!.phone,
      firstName: request.user!.firstName,
      lastName: request.user!.lastName,
      nickname: request.user!.nickname,
      media: request.user!.media,
      roleId: request.user!.roleId,
      role: request.user!.role,
      isAdmin: Boolean(request.user!.roleId),
    });
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(ACCESS_COOKIE, { path: "/" });
    return ok({ loggedOut: true });
  });

  // helper for seed/scripts (internal)
  void hashPassword;
}
