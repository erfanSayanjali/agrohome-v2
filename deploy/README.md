# استقرار با داکر (path-based)

یک دامنه، بدون ساب‌دامین:

| مسیر | سرویس |
|------|--------|
| `/admin*` | پنل ادمین (`basePath: /admin`) |
| `/api*` ، `/uploads*` | Fastify API |
| `/*` | سایت اصلی |

## پروداکشن

```bash
docker compose up --build
# http://localhost/admin  ·  http://localhost/api/v1/...  ·  http://localhost/
```

متغیرهای حساس را در `.env` ریشه یا محیط سرور ست کنید (`JWT_SECRET`, `ADMIN_PASSWORD`, `REVALIDATE_SECRET`, …).

## توسعه روی هاست + پروکسی شبیه پرود

```bash
pnpm dev                  # main:4000 admin:4001 api:3002
pnpm proxy:dev            # Caddy روی :8080
# http://localhost:8080/admin
```

ادمین بدون پروکسی: `http://localhost:4001/admin`
