import { authLocales } from '@padel/auth';
import { destinationsLocales } from '@padel/destinations';
import { buildResources, createI18n, getDeviceLanguage } from '@padel/i18n';
import { listingsLocales } from '@padel/listings';
import { playersLocales } from '@padel/players';
import { profilesLocales } from '@padel/profiles';
import { tripsLocales } from '@padel/trips';
import { uiLocales } from '@padel/ui';

import { appLocales } from './locales';

export const resources = buildResources({
  app: appLocales,
  auth: authLocales,
  ui: uiLocales,
  listings: listingsLocales,
  players: playersLocales,
  profiles: profilesLocales,
  trips: tripsLocales,
  destinations: destinationsLocales,
});

/** Synchronously initialised, so the first render already has its text. */
export const i18n = createI18n({ resources, language: getDeviceLanguage() });
