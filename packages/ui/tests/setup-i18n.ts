import { buildResources } from '@padel/i18n';
import { initTestI18n } from '@padel/i18n/testing';

import { uiLocales } from '../src/locales';

initTestI18n(buildResources({ ui: uiLocales }));
