import { getLocales } from "expo-localization";

/** The device's preferred language code (e.g. "en"), or undefined when it can't be read. */
export function getDeviceLanguage(): string | undefined {
  return getLocales()[0]?.languageCode ?? undefined;
}
