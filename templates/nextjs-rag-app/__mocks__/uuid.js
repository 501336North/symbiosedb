// Mock UUID module to avoid ESM issues in Jest
module.exports = {
  v4: () => 'test-uuid-12345',
  v1: () => 'test-uuid-v1',
  v5: () => 'test-uuid-v5',
};
