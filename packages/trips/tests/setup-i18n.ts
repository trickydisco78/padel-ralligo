import { destinationsLocales } from '@padel/destinations';
import { buildResources } from '@padel/i18n';
import { initTestI18n } from '@padel/i18n/testing';
import { uiLocales } from '@padel/ui';

import { tripsLocales } from '../src/locales';

// Importing @padel/destinations loads the Supabase client, which needs config; use the shared test double (hoisted above the imports).
jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

initTestI18n(buildResources({ trips: tripsLocales, ui: uiLocales, destinations: destinationsLocales }));
