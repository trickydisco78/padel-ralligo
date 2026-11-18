import { initTestI18n } from '@padel/i18n/testing';

import { resources } from '../i18n';

// Importing the packages' locales loads their entry points, which need a Supabase client; tests
// replace it with the in-memory fake (individual tests may still reset it).
jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));

initTestI18n(resources);
