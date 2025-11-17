/**
 * Migration Tracker
 * Tracks which migrations have been executed
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MigrationRecord {
  status: 'executed' | 'pending';
  executedAt: Date | null;
}

export interface MigrationInfo {
  filename: string;
  path: string;
}

export interface MigrationStatus {
  filename: string;
  status: 'executed' | 'pending';
  executedAt: Date | null;
}

export class MigrationTracker {
  private migrationsDir: string;
  private trackingFile: string;

  constructor(migrationsDir: string = './migrations', trackingFile: string = '.migrations.json') {
    this.migrationsDir = migrationsDir;
    this.trackingFile = trackingFile;
  }

  /**
   * Mark a migration as executed
   */
  async markAsRun(filename: string): Promise<void> {
    const data = this.loadTrackingData();

    data[filename] = {
      status: 'executed',
      executedAt: new Date().toISOString(),
    };

    this.saveTrackingData(data);
  }

  /**
   * Mark a migration as reverted (remove from tracking)
   */
  async markAsReverted(filename: string): Promise<void> {
    const data = this.loadTrackingData();

    delete data[filename];

    this.saveTrackingData(data);
  }

  /**
   * Check if a migration has been executed
   */
  async hasRun(filename: string): Promise<boolean> {
    const data = this.loadTrackingData();
    return filename in data;
  }

  /**
   * Get the most recently executed migration
   */
  async getLastRun(): Promise<MigrationInfo | null> {
    const data = this.loadTrackingData();

    if (Object.keys(data).length === 0) {
      return null;
    }

    // Sort by executedAt timestamp
    const sorted = Object.entries(data).sort((a, b) => {
      const dateA = new Date(a[1].executedAt as string).getTime();
      const dateB = new Date(b[1].executedAt as string).getTime();
      return dateB - dateA; // Descending order
    });

    const [filename] = sorted[0];

    return {
      filename,
      path: path.join(this.migrationsDir, filename),
    };
  }

  /**
   * Get all pending migrations
   */
  async getPendingMigrations(): Promise<MigrationInfo[]> {
    const allFiles = this.getMigrationFiles();
    const executed = this.loadTrackingData();

    const pending = allFiles
      .filter((filename) => !(filename in executed))
      .map((filename) => ({
        filename,
        path: path.join(this.migrationsDir, filename),
      }));

    // Sort chronologically by timestamp in filename
    return pending.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  /**
   * Get all migrations with their status
   */
  async getAllMigrations(): Promise<MigrationStatus[]> {
    const allFiles = this.getMigrationFiles();
    const executed = this.loadTrackingData();

    return allFiles.map((filename) => {
      const isExecuted = filename in executed;
      return {
        filename,
        status: isExecuted ? 'executed' : 'pending',
        executedAt: isExecuted ? new Date(executed[filename].executedAt as string) : null,
      };
    });
  }

  /**
   * Load tracking data from file
   */
  private loadTrackingData(): Record<string, any> {
    if (!fs.existsSync(this.trackingFile)) {
      return {};
    }

    const content = fs.readFileSync(this.trackingFile, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Save tracking data to file
   */
  private saveTrackingData(data: Record<string, any>): void {
    fs.writeFileSync(this.trackingFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Get all migration files from directory
   */
  private getMigrationFiles(): string[] {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    return fs
      .readdirSync(this.migrationsDir)
      .filter((file) => file.match(/^\d{14}_.*\.ts$/)) // Only timestamp-prefixed .ts files
      .sort(); // Chronological order
  }
}
