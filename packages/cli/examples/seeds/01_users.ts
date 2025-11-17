/**
 * Seed: users
 * Generated at: 2025-01-01T12:00:00.000Z
 */

import { PostgreSQLConnector } from '@symbiosedb/core';

export async function run({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`
    INSERT INTO users (email, name, password_hash) VALUES
      ('admin@example.com', 'Admin User', '$2b$10$abc123hashedpassword'),
      ('john@example.com', 'John Doe', '$2b$10$def456hashedpassword'),
      ('jane@example.com', 'Jane Smith', '$2b$10$ghi789hashedpassword'),
      ('bob@example.com', 'Bob Johnson', '$2b$10$jkl012hashedpassword');
  `);
}
