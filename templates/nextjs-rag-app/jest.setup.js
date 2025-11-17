require('@testing-library/jest-dom');

// Polyfill for pg library (uses TextEncoder/TextDecoder)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock UUID to avoid ESM issues
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-12345',
  v1: () => 'test-uuid-v1',
  v5: () => 'test-uuid-v5',
}));
