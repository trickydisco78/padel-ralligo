import type { Resource } from "i18next";
import { createI18n } from "./create-i18n";

/** Registers English copy for tests, so components render real text. Call from a Jest setup file. */
export function initTestI18n(resources: Resource) {
  return createI18n({ resources, language: "en" });
}
