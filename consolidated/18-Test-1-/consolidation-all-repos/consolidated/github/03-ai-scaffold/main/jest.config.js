import type { Config } from 'jest';
import nextJest from 'next/jest';

const jestConfig = nextJest({ dir: '.' });

const customJestConfig: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '@(.*)': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@testing-library|other-esm-package-name)/',
    '/\\.next/',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.[jt]s?(x)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**/*',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
    '!src/pages/api/**/*',
    '!src/lib/mocks/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
};

export default jestConfig(customJestConfig);