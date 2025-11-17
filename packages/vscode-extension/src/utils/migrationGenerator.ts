/**
 * Migration Generator (VS Code Extension)
 * Re-uses logic from @symbiosedb/cli
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MigrationFile {
  filename: string;
  path: string;
}

export class MigrationGenerator {
  private lastTimestamp: number = 0;

  constructor(private migrationsDir: string) {}

  generate(description: string): MigrationFile {
    // Ensure migrations directory exists
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    // Generate unique timestamp
    const timestamp = this.generateTimestamp();

    // Sanitize description
    const sanitizedDescription = this.sanitizeDescription(description);

    // Create filename
    const filename = `${timestamp}_${sanitizedDescription}.ts`;
    const filePath = path.join(this.migrationsDir, filename);

    // Generate file content
    const content = this.getTemplate(sanitizedDescription);

    // Write file
    fs.writeFileSync(filePath, content, 'utf-8');

    return {
      filename,
      path: filePath,
    };
  }

  private getTemplate(description: string): string {
    return `/**
 * Migration: ${description}
 * Generated at: ${new Date().toISOString()}
 */

import { PostgreSQLConnector } from '@symbiosedb/core';

export async function up({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  // Write your migration code here
  // Example:
  // await sql.query(\`
  //   CREATE TABLE users (
  //     id SERIAL PRIMARY KEY,
  //     email VARCHAR(255) UNIQUE NOT NULL,
  //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  //   );
  // \`);
}

export async function down({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  // Write your rollback code here
  // Example:
  // await sql.query(\`DROP TABLE IF EXISTS users;\`);
}
`;
  }

  private generateTimestamp(): string {
    let timestamp = Date.now();

    // Ensure uniqueness
    if (timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = timestamp;

    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private sanitizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
