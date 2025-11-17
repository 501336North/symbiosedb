// Mock uuid module to avoid ES module issues in Jest
// This allows tests to run without ESM compatibility problems
// Uses incremental counter to ensure unique IDs

let mockUuidCounter = 0;

module.exports = {
  v4: () => `test-uuid-${mockUuidCounter++}`,
  v1: () => `test-uuid-v1-${mockUuidCounter++}`,
  v5: () => `test-uuid-v5-${mockUuidCounter++}`,
  v3: () => `test-uuid-v3-${mockUuidCounter++}`,
  validate: () => true,
  version: () => 4,
};
