const base = require('@padel/jest-config/react-native');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  setupFilesAfterEnv: [...(base.setupFilesAfterEnv ?? []), '<rootDir>/tests/setup-i18n.ts'],
};
