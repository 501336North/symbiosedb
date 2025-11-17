/**
 * Migration Runner
 * Executes migrations up/down
 */

import * as path from 'path';
import { PostgreSQLConnector } from '@symbiosedb/core';
import { MigrationTracker, MigrationInfo } from './migration-tracker';

export interface MigrationModule {
  up: (context: { sql: PostgreSQLConnector }) => Promise<void>;
  down: (context: { sql: PostgreSQLConnector }) => Promise<void>;
}

export interface MigrationResult {
  executed: string[];
  failed: string[];
}

export interface MigrationStatusInfo {
  pending: string[];
  executed: Array<{
    filename: string;
    executedAt: Date;
  }>;
}

export class MigrationRunner {
  private migrationsDir: string;
  private tracker: MigrationTracker;
  private sqlClient: PostgreSQLConnector;

  constructor(migrationsDir: string, tracker: MigrationTracker, sqlClient: PostgreSQLConnector) {
    this.migrationsDir = migrationsDir;
    this.tracker = tracker;
    this.sqlClient = sqlClient;
  }

  /**
   * Run pending migrations
   */
  async runUp(targetMigration?: string): Promise<MigrationResult> {
    const executed: string[] = [];
    const failed: string[] = [];

    try {
      let migrations = await this.tracker.getPendingMigrations();

      // Filter to specific migration if specified
      if (targetMigration) {
        migrations = migrations.filter((m) => m.filename === targetMigration);
      }

      for (const migration of migrations) {
        try {
          const module = this.loadMigration(migration.filename);

          // Execute up() method
          await module.up({ sql: this.sqlClient });

          // Mark as executed
          await this.tracker.markAsRun(migration.filename);

          executed.push(migration.filename);
        } catch (error) {
          failed.push(migration.filename);

          // Rollback all executed migrations in reverse order
          for (let i = executed.length - 1; i >= 0; i--) {
            const rollbackFilename = executed[i];
            try {
              const module = this.loadMigration(rollbackFilename);
              await module.down({ sql: this.sqlClient });
              await this.tracker.markAsReverted(rollbackFilename);
            } catch (rollbackError) {
              // Log rollback error but continue
              console.error(`Failed to rollback ${rollbackFilename}:`, rollbackError);
            }
          }

          throw error; // Re-throw after rollback
        }
      }

      return { executed, failed };
    } catch (error) {
      // Re-throw the error after setting state
      throw error;
    }
  }

  /**
   * Rollback migrations
   */
  async runDown(targetMigration?: string): Promise<void> {
    let migration: MigrationInfo | null;

    if (targetMigration) {
      const hasRun = await this.tracker.hasRun(targetMigration);
      if (!hasRun) {
        throw new Error('Migration has not been run');
      }

      migration = {
        filename: targetMigration,
        path: path.join(this.migrationsDir, targetMigration),
      };
    } else {
      migration = await this.tracker.getLastRun();

      if (!migration) {
        throw new Error('No migrations to rollback');
      }
    }

    const module = this.loadMigration(migration.filename);

    // Execute down() method
    await module.down({ sql: this.sqlClient });

    // Mark as reverted
    await this.tracker.markAsReverted(migration.filename);
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<MigrationStatusInfo> {
    const all = await this.tracker.getAllMigrations();

    const pending = all.filter((m) => m.status === 'pending').map((m) => m.filename);

    const executed = all
      .filter((m) => m.status === 'executed' && m.executedAt)
      .map((m) => ({
        filename: m.filename,
        executedAt: m.executedAt!,
      }));

    return { pending, executed };
  }

  /**
   * Load migration module
   */
  private loadMigration(filename: string): MigrationModule {
    const migrationPath = path.resolve(this.migrationsDir, filename);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(migrationPath);
    return module;
  }
}
