const reactNative = require('@padel/jest-config/react-native');

/** @type {import('jest').Config} */
module.exports = {
  ...reactNative,
  setupFilesAfterEnv: [...(reactNative.setupFilesAfterEnv ?? []), '<rootDir>/src/__tests__/setup-i18n.ts'],
  moduleNameMapper: {
    ...reactNative.moduleNameMapper,
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
