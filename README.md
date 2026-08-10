# Agrohome Monorepo

فروشگاه تخصصی کود خانگی — ساختار آماده توسعه مجدد بک‌اند و پنل ادمین.

## ساختار

```
apps/
  api/           Fastify + Prisma
  web/
    main/        سایت عمومی (Next.js) — فعلاً با stub data
    admin/       اسکلت خالی پنل ادمین
packages/
  shared/        تایپ‌ها و ثابت‌های مشترک
docs/            PRD و مستندات محصول
```

## پیش‌نیاز

- Node.js 22+
- [pnpm](https://pnpm.io) 9+
- PostgreSQL (برای API)

## نصب

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/main/.env.example apps/web/main/.env
cp apps/web/admin/.env.example apps/web/admin/.env
```

## توسعه

```bash
# هر سه اپ به‌صورت موازی
pnpm dev

# جداگانه
pnpm dev:main    # http://localhost:4000
pnpm dev:admin   # http://localhost:4001
pnpm dev:api     # http://localhost:3002
```

## دیتابیس

```bash
pnpm db:generate
pnpm db:migrate
# یا
pnpm db:push
```

## مهاجرت داده از بک‌اند فعلی

بعد از آماده بودن schema و دسترسی ادمین به API قدیمی:

```bash
# در apps/api/.env مقداردهی کنید:
# LEGACY_API_BASE=http://agrohome.ir
# LEGACY_ACCESS_TOKEN=<accessToken cookie>
# DATABASE_URL=...

pnpm import:legacy -- --dry-run
pnpm import:legacy
pnpm import:legacy -- --download-media
```

اسکریپت entityها را از `/api/v1/*` می‌خواند، نگاشت می‌کند و با `legacyId` به‌صورت idempotent upsert می‌کند.

## وضعیت فعلی

- `web/main`: UI سایت حفظ شده؛ لایه `lib/data/stubs` به‌جای API قدیمی
- `web/admin`: اسکلت خالی برای توسعه پنل جدید
- `api`: health + schema فاز ۱ Prisma؛ CRUD/auth در مراحل بعدی
