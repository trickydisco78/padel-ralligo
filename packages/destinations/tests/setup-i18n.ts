import { buildResources } from '@padel/i18n';
import { initTestI18n } from '@padel/i18n/testing';
import { uiLocales } from '@padel/ui';

import { destinationsLocales } from '../src/locales';

initTestI18n(buildResources({ destinations: destinationsLocales, ui: uiLocales }));
