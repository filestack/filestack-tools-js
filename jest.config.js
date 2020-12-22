module.exports = {
  name: 'filestack-tools',
  collectCoverage: true,
  clearMocks: true,
  projects: [
  {
    displayName: 'Common',
    clearMocks: true,
    testMatch: ['<rootDir>/dist/main/**/*.spec.js', '<rootDir>/dist/main/**/*.spec.node.js'],
    testEnvironment: 'node',
    moduleFileExtensions: ['js'],
  }, {
    displayName: 'Browser',
    testMatch: ['<rootDir>/src/**/*.browser.spec.ts'],
    clearMocks: true,
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['js'],
    moduleNameMapper: {
      "\(.*)\\.node": "$1.browser",
    }
  }
]
};
