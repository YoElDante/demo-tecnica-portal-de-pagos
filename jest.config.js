module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/connection.db.test.js'],
  verbose: true,
  passWithNoTests: true,
};
