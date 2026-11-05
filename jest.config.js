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
    "\\.(css|scss)$": "identity-obj-proxy"
  }
}
