import type { Resource } from "i18next";

/** One package's copy: language code -> nested key/value JSON. */
export type Locales = Record<string, Record<string, unknown>>;

/**
 * Combines each package's locale files into i18next resources, using the
 * package's namespace as the key: `{ auth: authLocales }` makes `auth:...` keys
 * resolve from `authLocales.<language>`.
 */
export function buildResources(namespaces: Record<string, Locales>): Resource {
  const resources: Resource = {};
  for (const [namespace, locales] of Object.entries(namespaces)) {
    for (const [language, copy] of Object.entries(locales)) {
      resources[language] = { ...resources[language], [namespace]: copy };
    }
  }
  return resources;
}
