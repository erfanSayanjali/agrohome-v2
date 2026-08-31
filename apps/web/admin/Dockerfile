# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/web/admin/package.json apps/web/admin/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --filter @agrohome/admin... --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/admin/node_modules ./apps/web/admin/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=
ENV API_URL=http://api:3002
WORKDIR /app/apps/web/admin
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/apps/web/admin/.next ./apps/web/admin/.next
COPY --from=builder /app/apps/web/admin/public ./apps/web/admin/public
COPY --from=builder /app/apps/web/admin/package.json ./apps/web/admin/package.json
COPY --from=builder /app/apps/web/admin/node_modules ./apps/web/admin/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
WORKDIR /app/apps/web/admin
EXPOSE 3001
CMD ["pnpm", "start"]
