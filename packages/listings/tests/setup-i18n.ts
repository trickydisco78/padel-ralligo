import { buildResources } from '@padel/i18n';
import { initTestI18n } from '@padel/i18n/testing';
import { uiLocales } from '@padel/ui';

import { listingsLocales } from '../src/locales';

// Importing the destinations entry point pulls in the Supabase client, which needs config at load time.
// Tests that use Supabase install their own mock; this one only needs the module to load.
jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { destinationsLocales } = require('@padel/destinations') as typeof import('@padel/destinations');

initTestI18n(buildResources({ listings: listingsLocales, destinations: destinationsLocales, ui: uiLocales }));
