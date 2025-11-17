/**
 * Seed Commands
 * Command handlers for seed operations
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SeedGenerator } from '../utils/seedGenerator';
import { SeedRunner } from '../utils/seedRunner';
import { SeedItem } from '../providers/seedTreeProvider';

export class SeedCommands {
  constructor(
    private context: vscode.ExtensionContext,
    private refreshCallback: () => void
  ) {}

  /**
   * Create a new seed
   */
  async createSeed(): Promise<void> {
    const description = await vscode.window.showInputBox({
      prompt: 'Enter seed description (e.g., users)',
      placeHolder: 'users',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Description cannot be empty';
        }
        if (!/^[a-z0-9_]+$/i.test(value)) {
          return 'Description must contain only letters, numbers, and underscores';
        }
        return null;
      }
    });

    if (!description) {
      return;
    }

    try {
      const config = vscode.workspace.getConfiguration('symbiosedb');
      const seedsDir = config.get<string>('paths.seedsDir', './seeds');
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
      const fullPath = path.join(workspaceRoot, seedsDir);

      const generator = new SeedGenerator(fullPath);
      const result = generator.generate(description);

      // Open the created file
      const document = await vscode.workspace.openTextDocument(result.path);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage(
        `Seed created: ${result.filename}`
      );

      this.refreshCallback();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create seed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Run all seeds
   */
  async runAllSeeds(): Promise<void> {
    const confirm = await vscode.window.showInformationMessage(
      'Run all seeds?',
      'Run Seeds',
      'Cancel'
    );

    if (confirm !== 'Run Seeds') {
      return;
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Running seeds...',
          cancellable: false
        },
        async (progress) => {
          const config = vscode.workspace.getConfiguration('symbiosedb');
          const seedsDir = config.get<string>('paths.seedsDir', './seeds');
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
          const fullPath = path.join(workspaceRoot, seedsDir);

          const runner = new SeedRunner(fullPath);
          const result = await runner.runAll();

          progress.report({ increment: 100 });

          if (result.executed.length > 0) {
            vscode.window.showInformationMessage(
              `✓ Ran ${result.executed.length} seed(s):\n${result.executed.join('\n')}`
            );
          } else {
            vscode.window.showInformationMessage('No seeds to run');
          }

          this.refreshCallback();
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Seed failed: ${error instanceof Error ? error.message : String(error)}`
      );
      this.refreshCallback();
    }
  }

  /**
   * Run a specific seed
   */
  async runOneSeed(item: SeedItem): Promise<void> {
    const confirm = await vscode.window.showInformationMessage(
      `Run seed: ${item.label}?`,
      'Run Seed',
      'Cancel'
    );

    if (confirm !== 'Run Seed') {
      return;
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Running ${item.label}...`,
          cancellable: false
        },
        async (progress) => {
          const config = vscode.workspace.getConfiguration('symbiosedb');
          const seedsDir = config.get<string>('paths.seedsDir', './seeds');
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
          const fullPath = path.join(workspaceRoot, seedsDir);

          const runner = new SeedRunner(fullPath);
          await runner.runOne(item.label);

          progress.report({ increment: 100 });

          vscode.window.showInformationMessage(`✓ Seed executed: ${item.label}`);
          this.refreshCallback();
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Seed failed: ${error instanceof Error ? error.message : String(error)}`
      );
      this.refreshCallback();
    }
  }

  /**
   * Open seed file
   */
  async openSeedFile(item: SeedItem): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(item.filePath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
