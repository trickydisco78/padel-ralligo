import { createInstance, type i18n, type Resource } from "i18next";
import { initReactI18next } from "react-i18next";

export const DEFAULT_LANGUAGE = "en";

export type CreateI18nOptions = {
  resources: Resource;
  /** Preferred language code, e.g. from the device. Falls back to English when there is no copy for it. */
  language?: string;
};

/**
 * Creates the app's i18next instance and registers it for `useTranslation`.
 * Initialisation is synchronous because all copy is bundled.
 */
export function createI18n({ resources, language }: CreateI18nOptions): i18n {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: language && language in resources ? language : DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: false,
    interpolation: { escapeValue: false },
    initAsync: false,
    returnNull: false,
  });
  return instance;
}
