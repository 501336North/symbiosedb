/**
 * Seed: posts
 * Generated at: 2025-01-01T13:00:00.000Z
 */

import { PostgreSQLConnector } from '@symbiosedb/core';

export async function run({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`
    INSERT INTO posts (user_id, title, content, status, published_at) VALUES
      (1, 'Welcome to SymbioseDB', 'This is our first blog post about the new database system.', 'published', '2025-01-01 12:00:00'),
      (2, 'Getting Started Guide', 'Learn how to get started with SymbioseDB in 5 minutes.', 'published', '2025-01-02 10:00:00'),
      (2, 'Advanced Features', 'Explore the advanced features of SymbioseDB including vector search and blockchain attestations.', 'published', '2025-01-03 14:00:00'),
      (3, 'Draft Post', 'This is a draft post that hasn''t been published yet.', 'draft', NULL);
  `);
}
