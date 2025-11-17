/**
 * Migration: create_posts_table
 * Generated at: 2025-01-01T13:00:00.000Z
 */

import { PostgreSQLConnector } from '@symbiosedb/core';

export async function up({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`
    CREATE TABLE posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'draft',
      published_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  await sql.query(`
    CREATE INDEX idx_posts_user_id ON posts(user_id);
    CREATE INDEX idx_posts_status ON posts(status);
    CREATE INDEX idx_posts_published_at ON posts(published_at);
  `);
}

export async function down({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`DROP TABLE IF EXISTS posts;`);
}
