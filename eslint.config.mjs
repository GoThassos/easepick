// Flat config (ESLint 9+), ported from the former .eslintrc.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/__tests__/**', '**/*.js', '.rollup.cache/**'],
  },
  {
    files: ['packages/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Warnings under the old ESLint 8 / typescript-eslint 5 config;
      // typescript-eslint 8 makes them errors. Keep them as warnings.
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      // New in ESLint 10's recommended set.
      'no-useless-assignment': 'warn',
    },
  },
);
