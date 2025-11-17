/**
 * Migration Commands
 * Command handlers for migration operations
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { MigrationGenerator } from '../utils/migrationGenerator';
import { MigrationRunner } from '../utils/migrationRunner';
import { MigrationItem } from '../providers/migrationTreeProvider';

export class MigrationCommands {
  constructor(
    private context: vscode.ExtensionContext,
    private refreshCallback: () => void
  ) {}

  /**
   * Create a new migration
   */
  async createMigration(): Promise<void> {
    const description = await vscode.window.showInputBox({
      prompt: 'Enter migration description (e.g., create_users_table)',
      placeHolder: 'create_users_table',
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
      const migrationsDir = config.get<string>('paths.migrationsDir', './migrations');
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
      const fullPath = path.join(workspaceRoot, migrationsDir);

      const generator = new MigrationGenerator(fullPath);
      const result = generator.generate(description);

      // Open the created file
      const document = await vscode.workspace.openTextDocument(result.path);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage(
        `Migration created: ${result.filename}`
      );

      this.refreshCallback();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create migration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      'Run all pending migrations?',
      { modal: true },
      'Run Migrations'
    );

    if (confirm !== 'Run Migrations') {
      return;
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Running migrations...',
          cancellable: false
        },
        async (progress) => {
          const config = vscode.workspace.getConfiguration('symbiosedb');
          const migrationsDir = config.get<string>('paths.migrationsDir', './migrations');
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
          const fullPath = path.join(workspaceRoot, migrationsDir);

          const runner = new MigrationRunner(fullPath);
          const result = await runner.runUp();

          progress.report({ increment: 100 });

          if (result.executed.length > 0) {
            vscode.window.showInformationMessage(
              `✓ Ran ${result.executed.length} migration(s):\n${result.executed.join('\n')}`
            );
          } else {
            vscode.window.showInformationMessage('No pending migrations to run');
          }

          this.refreshCallback();
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Migration failed: ${error instanceof Error ? error.message : String(error)}`
      );
      this.refreshCallback();
    }
  }

  /**
   * Run a specific migration
   */
  async runOneMigration(item: MigrationItem): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      `Run migration: ${item.label}?`,
      { modal: true },
      'Run Migration'
    );

    if (confirm !== 'Run Migration') {
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
          const migrationsDir = config.get<string>('paths.migrationsDir', './migrations');
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
          const fullPath = path.join(workspaceRoot, migrationsDir);

          const runner = new MigrationRunner(fullPath);
          await runner.runUp(item.label);

          progress.report({ increment: 100 });

          vscode.window.showInformationMessage(`✓ Migration executed: ${item.label}`);
          this.refreshCallback();
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Migration failed: ${error instanceof Error ? error.message : String(error)}`
      );
      this.refreshCallback();
    }
  }

  /**
   * Rollback the last migration
   */
  async rollbackMigration(): Promise<void> {
    const config = vscode.workspace.getConfiguration('symbiosedb');
    const confirmDestructive = config.get<boolean>('ui.confirmDestructive', true);

    if (confirmDestructive) {
      const confirm = await vscode.window.showWarningMessage(
        'Rollback the last migration? This will delete data!',
        { modal: true },
        'Rollback'
      );

      if (confirm !== 'Rollback') {
        return;
      }
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Rolling back migration...',
          cancellable: false
        },
        async (progress) => {
          const config = vscode.workspace.getConfiguration('symbiosedb');
          const migrationsDir = config.get<string>('paths.migrationsDir', './migrations');
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
          const fullPath = path.join(workspaceRoot, migrationsDir);

          const runner = new MigrationRunner(fullPath);
          await runner.runDown();

          progress.report({ increment: 100 });

          vscode.window.showInformationMessage('✓ Migration rolled back');
          this.refreshCallback();
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Rollback failed: ${error instanceof Error ? error.message : String(error)}`
      );
      this.refreshCallback();
    }
  }

  /**
   * Rollback a specific migration
   */
  async rollbackOneMigration(item: MigrationItem): Promise<void> {
    const config = vscode.workspace.getConfiguration('symbiosedb');
    const confirmDestructive = config.get<boolean>('ui.confirmDestructive', true);

    if (confirmDestructive) {
      const confirm = await vscode.window.showWarningMessage(
        `Rollback migration: ${item.label}? This will delete data!`,
        { modal: true },
        'Rollback'
      );

      if (confirm !== 'Rollback') {
        return;
      }
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Rolling back ${item.label}...`,
          cancellable: false
        },
        async (progress) => {
          const config = vscode.workspace.getConfiguration('symbiosedb');
          const migrationsDir = config.get<string>('paths.migrationsDir', './migrations');
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
          const fullPath = path.join(workspaceRoot, migrationsDir);

          const runner = new MigrationRunner(fullPath);
          await runner.runDown(item.label);

          progress.report({ increment: 100 });

          vscode.window.showInformationMessage(`✓ Migration rolled back: ${item.label}`);
          this.refreshCallback();
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Rollback failed: ${error instanceof Error ? error.message : String(error)}`
      );
      this.refreshCallback();
    }
  }

  /**
   * Show migration status
   */
  async showMigrationStatus(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('symbiosedb');
      const migrationsDir = config.get<string>('paths.migrationsDir', './migrations');
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
      const fullPath = path.join(workspaceRoot, migrationsDir);

      const runner = new MigrationRunner(fullPath);
      const status = await runner.getStatus();

      let message = '# Migration Status\n\n';
      message += `## ✓ Executed (${status.executed.length}):\n`;
      status.executed.forEach((m) => {
        message += `- ${m.filename} (${new Date(m.executedAt!).toLocaleString()})\n`;
      });

      message += `\n## ⏳ Pending (${status.pending.length}):\n`;
      status.pending.forEach((filename) => {
        message += `- ${filename}\n`;
      });

      const doc = await vscode.workspace.openTextDocument({
        content: message,
        language: 'markdown'
      });
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to get migration status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Open migration file
   */
  async openMigrationFile(item: MigrationItem): Promise<void> {
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
