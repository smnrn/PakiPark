const nextJest = require('./src/Frontend/node_modules/next/jest');

const createJestConfig = nextJest({
  // Path to the Next.js app so next/jest can find next.config.ts and .env files
  dir: './src/Frontend',
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/src/Frontend/.next/'],
  modulePathIgnorePatterns: ['<rootDir>/src/Frontend/.next/'],
  moduleNameMapper: {
    // Support @/* alias pointing at src/Frontend/src/*
    '^@/(.*)$': '<rootDir>/src/Frontend/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/Frontend/src/**/*.{ts,tsx}',
    '!<rootDir>/src/Frontend/src/**/*.d.ts',
  ],
  // Coverage thresholds intentionally set low — increase as test suite grows
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
