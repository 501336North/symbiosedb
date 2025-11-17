/**
 * Jest setup file
 * Mocks uuid to avoid ES module issues
 */

let mockUuidCounter = 0;

jest.mock('uuid', () => ({
  v4: () => `test-uuid-${mockUuidCounter++}`,
}));
