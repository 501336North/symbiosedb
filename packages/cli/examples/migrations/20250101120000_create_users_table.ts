/**
 * Migration: create_users_table
 * Generated at: 2025-01-01T12:00:00.000Z
 */

import { PostgreSQLConnector } from '@symbiosedb/core';

export async function up({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create index on email for faster lookups
  await sql.query(`
    CREATE INDEX idx_users_email ON users(email);
  `);
}

export async function down({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`DROP TABLE IF EXISTS users;`);
}
