import { toMediaRef, type MediaRef } from "@agrohome/shared";

export function normalizeMedia(value: unknown): MediaRef | null {
  return toMediaRef(value);
}

export function normalizeGallery(value: unknown): MediaRef[] {
  if (!Array.isArray(value)) {
    const one = toMediaRef(value);
    return one ? [one] : [];
  }
  return value.map((item) => toMediaRef(item)).filter(Boolean) as MediaRef[];
}
