const reactNative = require('@padel/jest-config/react-native');

/** @type {import('jest').Config} */
module.exports = {
  ...reactNative,
  setupFilesAfterEnv: [
    ...(reactNative.setupFilesAfterEnv ?? []),
    '<rootDir>/src/__tests__/setup-i18n.ts',
    '<rootDir>/src/__tests__/setup-reanimated.ts',
    '<rootDir>/src/__tests__/setup-launch.ts',
  ],
  moduleNameMapper: {
    ...reactNative.moduleNameMapper,
    '^react-native-reanimated/mock$': '<rootDir>/src/__tests__/reanimated-mock.ts',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
