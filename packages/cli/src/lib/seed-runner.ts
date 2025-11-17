/**
 * Seed Runner
 * Executes seed files
 */

import * as fs from 'fs';
import * as path from 'path';
import { PostgreSQLConnector } from '@symbiosedb/core';

export interface SeedModule {
  run: (context: { sql: PostgreSQLConnector }) => Promise<void>;
}

export interface SeedResult {
  executed: string[];
  failed: string[];
}

export class SeedRunner {
  private seedsDir: string;
  private sqlClient: PostgreSQLConnector;

  constructor(seedsDir: string, sqlClient: PostgreSQLConnector) {
    this.seedsDir = seedsDir;
    this.sqlClient = sqlClient;
  }

  /**
   * Run all seed files in order
   */
  async runAll(): Promise<SeedResult> {
    const executed: string[] = [];
    const failed: string[] = [];

    const seedFiles = this.getSeedFiles();

    for (const filename of seedFiles) {
      try {
        const module = this.loadSeed(filename);

        // Execute run() method
        await module.run({ sql: this.sqlClient });

        executed.push(filename);
      } catch (error) {
        failed.push(filename);
        throw error; // Stop on first failure
      }
    }

    return { executed, failed };
  }

  /**
   * Run a specific seed file
   */
  async runOne(filename: string): Promise<void> {
    const module = this.loadSeed(filename);
    await module.run({ sql: this.sqlClient });
  }

  /**
   * Get all seed files in order
   */
  private getSeedFiles(): string[] {
    if (!fs.existsSync(this.seedsDir)) {
      return [];
    }

    return fs
      .readdirSync(this.seedsDir)
      .filter((file) => file.match(/^\d{2}_.*\.ts$/)) // Only numbered .ts files
      .sort(); // Numerical order
  }

  /**
   * Load seed module
   */
  private loadSeed(filename: string): SeedModule {
    const seedPath = path.resolve(this.seedsDir, filename);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(seedPath);
    return module;
  }
}
