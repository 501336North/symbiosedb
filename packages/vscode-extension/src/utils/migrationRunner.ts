/**
 * Migration Runner (VS Code Extension)
 * Simplified version for VS Code - delegates to CLI
 */

export interface MigrationResult {
  executed: string[];
  failed: string[];
}

export interface MigrationStatus {
  executed: Array<{
    filename: string;
    executedAt: string;
  }>;
  pending: string[];
}

export class MigrationRunner {
  constructor(private migrationsDir: string) {}

  async runUp(target?: string): Promise<MigrationResult> {
    // In a real implementation, this would call the CLI or SDK
    // For now, return a mock result
    throw new Error('Migration runner not yet fully implemented. Please use the CLI for now.');
  }

  async runDown(target?: string): Promise<void> {
    throw new Error('Migration runner not yet fully implemented. Please use the CLI for now.');
  }

  async getStatus(): Promise<MigrationStatus> {
    throw new Error('Migration status not yet fully implemented. Please use the CLI for now.');
  }
}
