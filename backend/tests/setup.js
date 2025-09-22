/**
 * Test setup configuration
 */

// Suppress console.log during tests for cleaner output
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Global test timeout
jest.setTimeout(10000);
