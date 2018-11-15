module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  roots: ['<rootDir>/src'],
  modulePaths: ['src', 'node_modules'],
  moduleFileExtensions: ['js', 'ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testEnvironment: 'node',
  setupTestFrameworkScriptFile: './jest.setup.js',
  testMatch: ['**/test/**/*.test.(ts|js)'],
  preset: 'ts-jest'
};
