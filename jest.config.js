module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // TypeScript 6 defaults `types` to []; tests use Jest globals and require().
      tsconfig: { types: ['jest', 'node'] },
      diagnostics: {
        ignoreCodes: ['TS151001'],
      },
    }],
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    // Run (and measure) the packages' sources rather than their builds, so
    // coverage maps to `src/`. Type checking still reads `dist/*.d.ts`, so
    // build first. Only bare package names: `…/dist/types` is type-only.
    "^@gothassos/easepick-([^/]+)$": "<rootDir>/packages/$1/src/index.ts",
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
}
