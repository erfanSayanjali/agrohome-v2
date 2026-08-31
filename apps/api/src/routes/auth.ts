import type { FastifyInstance } from "fastify";

import {

  ACCESS_COOKIE,

  generateOtpCode,

  hashOtp,

  hashPassword,

  otpExpiresAt,

  signAccessToken,

  verifyOtpHash,

  verifyPassword,

} from "../lib/auth";

import { isIranMobile, ok } from "../lib/helpers";

import { Fa } from "../lib/errors";

import { requireAuth } from "../plugins/auth";

import { createRateLimiter } from "../lib/rate-limit";



const authRateLimit = createRateLimiter({ max: 20, windowMs: 15 * 60 * 1000, keyPrefix: "auth" });

const otpRateLimit = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000, keyPrefix: "otp" });

const otpVerifyPhoneLimit = createRateLimiter({

  max: 5,

  windowMs: 15 * 60 * 1000,

  keyPrefix: "otp-verify-phone",

  keyFromRequest: (request) => {

    const body = (request.body ?? {}) as { phone?: string };

    return body.phone && isIranMobile(body.phone) ? body.phone : clientFallback(request);

  },

});



function clientFallback(request: { ip: string; headers: Record<string, unknown> }) {

  const forwarded = request.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {

    return forwarded.split(",")[0]!.trim();

  }

  return request.ip;

}



const COOKIE_OPTIONS = {

  path: "/",

  httpOnly: true,

  sameSite: "lax" as const,

  secure: process.env.NODE_ENV === "production",

  maxAge: 60 * 60 * 24 * 7,

};



function setAuthCookie(reply: { setCookie: Function }, token: string) {

  reply.setCookie(ACCESS_COOKIE, token, COOKIE_OPTIONS);

}



function clearAuthCookie(reply: { clearCookie: Function }) {

  reply.clearCookie(ACCESS_COOKIE, COOKIE_OPTIONS);

}



export async function authRoutes(app: FastifyInstance) {

  app.post("/auth/check-phone", { preHandler: [authRateLimit] }, async (request, reply) => {

    const { phone } = (request.body ?? {}) as { phone?: string };

    if (!phone || !isIranMobile(phone)) {

      return reply.badRequest(Fa.invalidPhone);

    }

    return ok({ canProceed: true });

  });



  app.post("/auth/request-otp", { preHandler: [otpRateLimit] }, async (request, reply) => {

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

    if (process.env.NODE_ENV !== "production") {

      app.log.info({ phone, expiresAt }, "[OTP] verification code sent (dev only)");

      console.log(`[OTP] phone=${phone} code=${code} expiresAt=${expiresAt.toISOString()}`);

    }

    return ok({ sent: true, expiresInSec: 300 });

  });



  app.post(

    "/auth/verify-otp",

    { preHandler: [otpRateLimit, otpVerifyPhoneLimit] },

    async (request, reply) => {

      const body = (request.body ?? {}) as {

        phone?: string;

        code?: string;

        firstName?: string;

        lastName?: string;

      };

      if (!body.phone || !isIranMobile(body.phone) || !body.code) {

        return reply.badRequest(Fa.phoneAndCodeRequired);

      }



      const codeHash = hashOtp(String(body.code));

      const challenge = await app.prisma.$transaction(async (tx) => {

        const row = await tx.otpChallenge.findFirst({

          where: {

            phone: body.phone,

            consumed: false,

            expiresAt: { gt: new Date() },

          },

          orderBy: { createdAt: "desc" },

        });

        if (!row || !verifyOtpHash(String(body.code), row.codeHash)) {

          return null;

        }

        const consumed = await tx.otpChallenge.updateMany({

          where: { id: row.id, consumed: false },

          data: { consumed: true },

        });

        if (consumed.count !== 1) return null;

        return row;

      });

      if (!challenge) {

        return reply.unauthorized(Fa.invalidOtp);

      }



      let user = await app.prisma.user.findUnique({

        where: { phone: body.phone },

        include: { role: true },

      });

      if (!user) {

        try {

          user = await app.prisma.user.create({

            data: {

              phone: body.phone,

              firstName: body.firstName,

              lastName: body.lastName,

            },

            include: { role: true },

          });

        } catch {

          user = await app.prisma.user.findUnique({

            where: { phone: body.phone },

            include: { role: true },

          });

          if (!user) return reply.internalServerError(Fa.internal);

        }

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

    }

  );



  app.post("/auth/login-password", { preHandler: [authRateLimit] }, async (request, reply) => {

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

    clearAuthCookie(reply);

    return ok({ loggedOut: true });

  });



  void hashPassword;
}


