/** واحدهای استاندارد بسته (طبق PRD فاز ۱) */
export const PACKAGE_UNITS = [
  { value: "کیلوگرم", label: "کیلوگرم" },
  { value: "گرم", label: "گرم" },
  { value: "لیتر", label: "لیتر" },
  { value: "میلی‌لیتر", label: "میلی‌لیتر" },
] as const;

export type PackageUnit = (typeof PACKAGE_UNITS)[number]["value"];

export const DEFAULT_PACKAGE_UNIT: PackageUnit = "کیلوگرم";

export function normalizePackageUnit(unit?: string | null): PackageUnit {
  const found = PACKAGE_UNITS.find((u) => u.value === unit);
  return found?.value ?? DEFAULT_PACKAGE_UNIT;
}
