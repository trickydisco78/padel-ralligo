/**
 * Jest preset for pure TypeScript packages (no React Native).
 * Tests live in `src/**` next to the code or in `tests/**`.
 * Requires `@swc/jest` in the consuming package.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testMatch: ['<rootDir>/{src,tests}/**/*.test.ts'],
  transform: { '^.+\\.ts$': '@swc/jest' },
};
