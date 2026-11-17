/**
 * Jest preset for packages and apps containing React Native code.
 * Tests live in `src/**` next to the code or in `tests/**`.
 * Requires `jest-expo` in the consuming package.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '\\.css$': require.resolve('./style-stub.cjs'),
  },
  testMatch: ['<rootDir>/{src,tests}/**/*.test.{ts,tsx}'],
};
