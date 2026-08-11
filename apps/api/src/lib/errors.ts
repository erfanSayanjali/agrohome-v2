import { Prisma } from "@prisma/client";

/** پیام‌های استاندارد API به فارسی */
export const Fa = {
  // عمومی
  badRequest: "درخواست نامعتبر است.",
  unauthorized: "برای ادامه باید وارد شوید.",
  forbidden: "دسترسی به این بخش مجاز نیست.",
  notFound: "مورد درخواستی یافت نشد.",
  conflict: "این مورد با داده موجود تداخل دارد.",
  payloadTooLarge: "حجم فایل یا داده بیش از حد مجاز است.",
  unsupportedMedia: "نوع فایل یا محتوا پشتیبانی نمی‌شود.",
  tooManyRequests: "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.",
  internal: "خطای داخلی سرور رخ داد. لطفاً دوباره تلاش کنید.",
  routeNotFound: "آدرس درخواستی یافت نشد.",
  validation: "اطلاعات ارسال‌شده معتبر نیست.",
  invalidJson: "فرمت داده‌های ارسالی نامعتبر است.",

  // احراز هویت
  invalidPhone: "شماره موبایل معتبر نیست. فرمت صحیح: ۰۹xxxxxxxxx",
  phoneAndCodeRequired: "شماره موبایل و کد تأیید الزامی است.",
  phoneAndPasswordRequired: "شماره موبایل و رمز عبور الزامی است.",
  invalidOtp: "کد تأیید نامعتبر یا منقضی شده است.",
  invalidCredentials: "شماره موبایل یا رمز عبور اشتباه است.",
  userNotFound: "کاربر یافت نشد.",
  adminRequired: "برای دسترسی به پنل، نقش ادمین لازم است.",
  permissionDenied: "مجوز لازم برای این عملیات را ندارید.",

  // رسانه
  fileRequired: "انتخاب فایل الزامی است.",

  // کاربران / نقش
  roleIdRequired: "انتخاب نقش الزامی است.",
  userAlreadyHasRole: "این کاربر از قبل نقش دارد و قابل تغییر نیست.",
  passwordMinLength: "رمز عبور باید حداقل ۶ کاراکتر باشد.",

  // نظرات / تماس
  commentFieldsRequired: "نام، متن نظر و نوع هدف الزامی است.",
  commentContentRequired: "متن پاسخ الزامی است.",
  commentTargetInvalid: "هدف نظر (محصول، مقاله یا والد) نامعتبر است.",
  commentTargetTypeInvalid: "نوع نظر باید محصول، مقاله یا پاسخ باشد.",
  contactMessageRequired: "متن پیام الزامی است.",

  // دسته‌بندی
  categoryHasChildren: "این دسته دارای زیرمجموعه است و قابل حذف نیست.",

  // CRUD / Prisma
  uniqueConstraint: "مقدار تکراری است؛ این مورد از قبل وجود دارد.",
  foreignKey: "ارجاع به موردی نامعتبر است یا هنوز استفاده می‌شود.",
  recordNotFound: "رکورد مورد نظر یافت نشد.",
  requiredField: "یکی از فیلدهای الزامی خالی است.",
  deleteFailed: "حذف این مورد ممکن نیست.",
  createFailed: "ایجاد مورد با خطا مواجه شد.",
  updateFailed: "به‌روزرسانی مورد با خطا مواجه شد.",
} as const;

export type FaKey = keyof typeof Fa;

const ACTION_LABEL: Record<string, string> = {
  create: "ایجاد",
  update: "ویرایش",
  delete: "حذف",
  read: "مشاهده",
};

const ENTITY_LABEL: Record<string, string> = {
  product: "محصول",
  product_category: "دسته‌بندی محصول",
  package: "بسته",
  specification: "مشخصه",
  product_specification: "مشخصات محصول",
  tag: "تگ",
  tag_category: "موضوع تگ",
  blog: "وبلاگ",
  blog_category: "دسته‌بندی وبلاگ",
  comment: "نظر",
  cms_page: "صفحه",
  site_settings: "تنظیمات سایت",
  content_block: "بلوک محتوا",
  seo: "سئو",
  media: "رسانه",
  role: "نقش",
  user: "کاربر",
  contact: "پیام تماس",
  "*": "همه بخش‌ها",
};

export function permissionDeniedMessage(entity: string, action: string) {
  const e = ENTITY_LABEL[entity] || entity;
  const a = ACTION_LABEL[action] || action;
  return `مجوز «${a}» برای «${e}» را ندارید.`;
}

/** نگاشت پیام‌های انگلیسی شناخته‌شده به فارسی */
const KNOWN_ENGLISH: Record<string, string> = {
  "Authentication required": Fa.unauthorized,
  "User not found": Fa.userNotFound,
  "Admin role required": Fa.adminRequired,
  "Invalid Iranian mobile phone": Fa.invalidPhone,
  "phone and code are required": Fa.phoneAndCodeRequired,
  "phone and password are required": Fa.phoneAndPasswordRequired,
  "Invalid or expired OTP": Fa.invalidOtp,
  "Invalid credentials": Fa.invalidCredentials,
  "file required": Fa.fileRequired,
  "roleId required": Fa.roleIdRequired,
  "User already has a role": Fa.userAlreadyHasRole,
  "password min length 6": Fa.passwordMinLength,
  "content required": Fa.commentContentRequired,
  "nickName, content, targetType required": Fa.commentFieldsRequired,
  "message required": Fa.contactMessageRequired,
  "Category has children": Fa.categoryHasChildren,
  "body/json must be object": Fa.invalidJson,
  "Not Found": Fa.routeNotFound,
  "Unauthorized": Fa.unauthorized,
  "Forbidden": Fa.forbidden,
  "Bad Request": Fa.badRequest,
  "Internal Server Error": Fa.internal,
  "FST_ERR_CTP_INVALID_MEDIA_TYPE": Fa.unsupportedMedia,
  "FST_ERR_CTP_EMPTY_JSON_BODY": Fa.invalidJson,
  "FST_ERR_CTP_INVALID_JSON_BODY": Fa.invalidJson,
};

export function toPersianMessage(message?: string | null): string {
  if (!message) return Fa.internal;
  const trimmed = message.trim();
  if (KNOWN_ENGLISH[trimmed]) return KNOWN_ENGLISH[trimmed];

  if (trimmed.startsWith("Missing permission ")) {
    const rest = trimmed.replace("Missing permission ", "");
    const [entity, action] = rest.split(":");
    return permissionDeniedMessage(entity || "*", action || "read");
  }

  // already Persian (contains Arabic/Persian letters)
  if (/[\u0600-\u06FF]/.test(trimmed)) return trimmed;

  return trimmed;
}

export function mapPrismaError(err: unknown): { statusCode: number; message: string } | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return { statusCode: 409, message: Fa.uniqueConstraint };
      case "P2003":
        return { statusCode: 400, message: Fa.foreignKey };
      case "P2025":
        return { statusCode: 404, message: Fa.recordNotFound };
      case "P2011":
        return { statusCode: 400, message: Fa.requiredField };
      case "P2014":
        return { statusCode: 400, message: Fa.foreignKey };
      default:
        return { statusCode: 400, message: Fa.badRequest };
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return { statusCode: 400, message: Fa.validation };
  }
  return null;
}

export function httpErrorBody(statusCode: number, message: string) {
  const errorLabel: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    413: "Payload Too Large",
    415: "Unsupported Media Type",
    429: "Too Many Requests",
    500: "Internal Server Error",
  };
  return {
    statusCode,
    error: errorLabel[statusCode] || "Error",
    message: toPersianMessage(message),
  };
}
