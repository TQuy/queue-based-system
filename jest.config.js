import { createRequire } from 'module'
import { pathsToModuleNameMapper } from 'ts-jest'

const require = createRequire(import.meta.url)
const tsconfig = require('./tsconfig.json')

/** @type {import('jest').Config} */
export default {
  // Use the ESM ts-jest preset so Jest can run ESM-style imports from TS.
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        verbatimModuleSyntax: false
      }
    }]
  },
  // Explicit alias mapping for ESM: map `@/x.js` -> source `.ts` so ts-jest can
  // transform imports that include `.js` extension, and keep `@/x` mapping too.
  moduleNameMapper: {
    '^@\/(.*)\\.js$': '<rootDir>/src/$1.ts',
    '^@\/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
}