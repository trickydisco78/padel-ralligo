const reactNative = require('@padel/jest-config/react-native');

/** @type {import('jest').Config} */
module.exports = {
  ...reactNative,
  moduleNameMapper: {
    ...reactNative.moduleNameMapper,
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
