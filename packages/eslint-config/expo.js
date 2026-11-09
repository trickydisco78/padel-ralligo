import expoConfig from "eslint-config-expo/flat.js";
import eslintConfigPrettier from "eslint-config-prettier";

/**
 * A shared ESLint configuration for Expo / React Native apps.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  ...expoConfig,
  eslintConfigPrettier,
  {
    ignores: ["dist/**", ".expo/**"],
  },
];
