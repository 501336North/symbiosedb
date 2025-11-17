/**
 * Seed Generator
 * Generates seed files with sequential numbering
 */

import * as fs from 'fs';
import * as path from 'path';

export interface SeedFile {
  filename: string;
  path: string;
}

export class SeedGenerator {
  private seedsDir: string;

  constructor(seedsDir: string) {
    this.seedsDir = seedsDir;
  }

  /**
   * Generate a new seed file
   */
  generate(description: string): SeedFile {
    // Ensure seeds directory exists
    if (!fs.existsSync(this.seedsDir)) {
      fs.mkdirSync(this.seedsDir, { recursive: true });
    }

    // Get next sequence number
    const sequenceNumber = this.getNextSequenceNumber();

    // Sanitize description
    const sanitizedDescription = this.sanitizeDescription(description);

    // Create filename
    const filename = `${sequenceNumber}_${sanitizedDescription}.ts`;
    const filePath = path.join(this.seedsDir, filename);

    // Generate file content
    const content = this.getTemplate(sanitizedDescription);

    // Write file
    fs.writeFileSync(filePath, content, 'utf-8');

    return {
      filename,
      path: filePath,
    };
  }

  /**
   * Get seed template
   */
  getTemplate(description: string): string {
    return `/**
 * Seed: ${description}
 * Generated at: ${new Date().toISOString()}
 */

import { PostgreSQLConnector } from '@symbiosedb/core';

export async function run({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  // Write your seed data here
  // Example:
  // await sql.query(\`
  //   INSERT INTO users (email, name) VALUES
  //     ('user1@example.com', 'User One'),
  //     ('user2@example.com', 'User Two'),
  //     ('user3@example.com', 'User Three');
  // \`);
}
`;
  }

  /**
   * Get next sequence number
   */
  private getNextSequenceNumber(): string {
    if (!fs.existsSync(this.seedsDir)) {
      return '01';
    }

    const existingSeeds = fs
      .readdirSync(this.seedsDir)
      .filter((file) => file.match(/^\d{2}_.*\.ts$/));

    if (existingSeeds.length === 0) {
      return '01';
    }

    // Get highest sequence number
    const numbers = existingSeeds.map((file) => {
      const match = file.match(/^(\d{2})_/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;

    return String(nextNumber).padStart(2, '0');
  }

  /**
   * Sanitize description for filesystem
   */
  private sanitizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
