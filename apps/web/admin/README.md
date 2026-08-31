# پنل ادمین آگروهوم (`@agrohome/admin`)

Next.js App Router + دیزاین‌سیستم داخلی (Radix primitives + Tailwind v4).

پایه مسیر: **`/admin`** (`basePath`). در پروداکشن پروکسی همین path را به این اپ می‌فرستد.

## اجرا

```bash
# از ریشه مونوریپو
pnpm --filter @agrohome/api dev      # :3002
pnpm --filter @agrohome/admin dev    # :4001 → http://localhost:4001/admin
```

ورود پیش‌فرض seed: `09120000000` / `admin123`

برای تست همان شکل پرود (یک origin):

```bash
docker compose -f docker-compose.proxy.yml up
# سپس http://localhost:8080/admin
```

## Env

کپی از `.env.example`:

| متغیر | توضیح |
|-------|--------|
| `API_URL` | مبدأ API برای rewrite سمت سرور Next (پیش‌فرض `http://localhost:3002`) |
| `NEXT_PUBLIC_API_URL` | معمولاً خالی؛ درخواست‌های مرورگر از همان origin (`/api/v1`) می‌روند و Next/پروکسی به API می‌رساند |

## دیزاین‌سیستم

کامپوننت‌ها در `components/ui/` — **در featureها از کنترل‌های native** (`<select>`, checkbox خام، toggle خام) **استفاده نکنید**. به‌جای آن‌ها:

- `Select` / `Combobox`
- `Switch` / `Checkbox` / `RadioGroup`
- `Dialog` / `DropdownMenu` / `Tabs` / `Tooltip`
- `Button` / `Input` / `Textarea` / `Pagination` / `Table`

## قرارداد لیست (URL = منبع حقیقت)

`useServerQuery` پارامترها را با searchParams همگام می‌کند و فقط به API می‌فرستد:

- `page`, `limit`, `sort`, `search`, `filters` (JSON)
- فیلتر/سورت/سرچ **لوکال روی آرایه انجام نمی‌شود**
- پاسخ: `{ content, total, meta: { page, limit, totalPages } }`

## ساختار

- `components/shell` — App Shell (سایدبار + تاپ‌بار + Drawer موبایل)
- `components/data` — DataToolbar / DataTable / CRUD مشترک / ConfirmDelete
- `app/(panel)` — داشبورد و ماژول‌های entity
- `app/(panel)/pages/[id]` — صفحه‌ساز بوم + سایدبار
- `app/(panel)/media` — کتابخانه رسانه + MediaPicker

## آمار داشبورد

فقط از `GET /api/v1/admin/stats` — بدون fetch لیست کامل.
