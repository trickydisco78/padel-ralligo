import type { TFunction } from "i18next";

/**
 * Turns domain validation errors (field -> translation key) into display text.
 * `params` supplies interpolation values such as `{ min: 8 }`; extra values are ignored by keys that don't use them.
 */
export function translateFieldErrors(
  t: TFunction,
  errors: Record<string, string>,
  params?: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).map(([field, key]) => [field, String(t(key, params ?? {}))]));
}
