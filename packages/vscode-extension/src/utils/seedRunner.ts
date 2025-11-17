/**
 * Seed Runner (VS Code Extension)
 * Simplified version for VS Code - delegates to CLI
 */

export interface SeedResult {
  executed: string[];
  failed: string[];
}

export class SeedRunner {
  constructor(private seedsDir: string) {}

  async runAll(): Promise<SeedResult> {
    // In a real implementation, this would call the CLI or SDK
    throw new Error('Seed runner not yet fully implemented. Please use the CLI for now.');
  }

  async runOne(filename: string): Promise<void> {
    throw new Error('Seed runner not yet fully implemented. Please use the CLI for now.');
  }
}
