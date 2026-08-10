import { createHash, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const OTP_TTL_MS = 5 * 60 * 1000;

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-agrohome-jwt-secret-change-me";
  return new TextEncoder().encode(secret);
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function otpExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + OTP_TTL_MS);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type JwtPayload = {
  sub: string;
  phone: string;
  roleId: string | null;
};

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ phone: payload.phone, roleId: payload.roleId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return {
    sub: String(payload.sub),
    phone: String(payload.phone ?? ""),
    roleId: (payload.roleId as string | null) ?? null,
  };
}

export const ACCESS_COOKIE = "accessToken";
