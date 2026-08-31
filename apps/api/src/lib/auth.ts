import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const OTP_TTL_MS = 5 * 60 * 1000;
const DEV_JWT_SECRET = "dev-agrohome-jwt-secret-change-me";

export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== "production") return;
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret === DEV_JWT_SECRET || secret === "change-me-in-production") {
    throw new Error("JWT_SECRET must be set to a strong value in production");
  }
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEV_JWT_SECRET;
  return new TextEncoder().encode(secret);
}

function getOtpPepper(): string {
  return process.env.JWT_SECRET || DEV_JWT_SECRET;
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(`${getOtpPepper()}:${code}`).digest("hex");
}

export function verifyOtpHash(code: string, codeHash: string): boolean {
  const expected = hashOtp(code);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(codeHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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
