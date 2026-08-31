# syntax=docker/dockerfile:1
# Deprecated entrypoint — prefer apps/web/main/Dockerfile via docker-compose.yml
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/web/main/package.json apps/web/main/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --filter @agrohome/main... --frozen-lockfile=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/main/node_modules ./apps/web/main/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=
ENV API_URL=http://api:3002
WORKDIR /app/apps/web/main
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/apps/web/main/.next ./apps/web/main/.next
COPY --from=builder /app/apps/web/main/public ./apps/web/main/public
COPY --from=builder /app/apps/web/main/package.json ./apps/web/main/package.json
COPY --from=builder /app/apps/web/main/node_modules ./apps/web/main/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
WORKDIR /app/apps/web/main
EXPOSE 3000
CMD ["pnpm", "start"]
