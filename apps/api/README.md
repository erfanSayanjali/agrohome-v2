# Agrohome API

Fastify + Prisma backend for Phase 1 (catalog, blog, comments, CMS page builder, auth).

## Setup

```bash
cp .env.example .env
# set DATABASE_URL, JWT_SECRET, ADMIN_PHONE, ADMIN_PASSWORD

pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

API: `http://localhost:3002`

## Env

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection |
| `JWT_SECRET` | JWT signing secret |
| `ADMIN_PHONE` | Seed admin phone (`09xxxxxxxxx`) |
| `ADMIN_PASSWORD` | Seed admin password |
| `PORT` | Default `3002` |

## Auth

- OTP: `POST /api/v1/auth/request-otp` then `POST /api/v1/auth/verify-otp`
  - Code is printed to **server console** (no SMS in Phase 1).
  - TTL: 5 minutes.
- Password: `POST /api/v1/auth/login-password` (admin with `passwordHash` + role)
- Session cookie: `accessToken` (httpOnly)
- `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`

## Admin API (`/api/v1/admin/*`, requires role)

- Catalog: `product-categories`, `products`, `packages`, `specifications`, `product-specifications`, `tags`, `tag-categories`
- Blog: `blog-categories`, `blogs`, `comments`
- CMS: `pages`, `regions`, `blocks`, `POST .../publish`, `GET pages/:id/editor`
- Misc: `seo`, `media` (+ `POST media/upload`), `roles`, `users`, `contact-messages`
- Stats: `GET /admin/stats` — lightweight counters only (`products`, `blogs`, `commentsPending`, `contactsNew`, `pages`, `media`, `users`, `categories`)

## List query contract

All paginated list endpoints accept:

| Query | Description |
|-------|-------------|
| `page` | 1-based page (default `1`) |
| `limit` | page size 1–100 (default `20`); `limit=0` returns **no rows**, only `total` + `meta` |
| `fields=meta` | same as meta-only (empty `content`) |
| `sort` | field name; prefix `-` for desc (default `-createdAt`) |
| `search` | free-text search on entity-specific fields |
| `filters` | JSON object (or `filter`) merged into Prisma `where` |

Response shape:

```json
{
  "content": [],
  "total": 42,
  "meta": { "page": 1, "limit": 20, "totalPages": 3 }
}
```

## Public API (`/api/v1/*`)

- `GET /pages/:slug`, `GET /regions/:key`, `POST /blocks/resolve`
- Products / categories / blogs / comments / contact / seo

## Smoke

With API running and seed applied:

```bash
pnpm smoke
```
