import type { FastifyReply, FastifyRequest } from "fastify";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.ip;
}

export function createRateLimiter(options: {
  max: number;
  windowMs: number;
  keyPrefix?: string;
  keyFromRequest?: (request: FastifyRequest) => string;
}) {
  const { max, windowMs, keyPrefix = "", keyFromRequest } = options;

  return async function rateLimitPreHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const key = `${keyPrefix}:${keyFromRequest ? keyFromRequest(request) : clientKey(request)}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (existing.count >= max) {
      return reply.status(429).send({
        statusCode: 429,
        error: "Too Many Requests",
        message: "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.",
      });
    }

    existing.count += 1;
  };
}
