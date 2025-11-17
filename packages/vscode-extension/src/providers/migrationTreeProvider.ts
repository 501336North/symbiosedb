/**
 * Migration Tree Provider
 * Displays database migrations in VS Code tree view
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface MigrationItem {
  label: string;
  status: 'pending' | 'executed';
  filePath: string;
  timestamp: string;
  description: string;
  executedAt?: string;
}

interface MigrationTracking {
  [filename: string]: {
    status: string;
    executedAt: string;
  };
}

export class MigrationTreeProvider implements vscode.TreeDataProvider<MigrationItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MigrationItem | undefined | null | void> =
    new vscode.EventEmitter<MigrationItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<MigrationItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get tree item representation for VS Code
   */
  getTreeItem(element: MigrationItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      vscode.TreeItemCollapsibleState.None
    );

    treeItem.contextValue = `migration-${element.status}`;
    treeItem.tooltip = this.getTooltip(element);
    treeItem.description = element.description;
    treeItem.iconPath = this.getIcon(element);
    treeItem.command = {
      command: 'symbiosedb.migration.openFile',
      title: 'Open Migration File',
      arguments: [element]
    };

    return treeItem;
  }

  /**
   * Get children (migrations) for the tree view
   */
  async getChildren(element?: MigrationItem): Promise<MigrationItem[]> {
    if (element) {
      return [];
    }

    const config = vscode.workspace.getConfiguration('symbiosedb');
    const migrationsDir = config.get<string>('paths.migrationsDir', './migrations');
    const fullPath = path.join(this.workspaceRoot, migrationsDir);

    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const files = fs.readdirSync(fullPath);
    const migrationFiles = files.filter((file) =>
      /^\d{14}_.*\.ts$/.test(file)
    );

    const trackingData = this.loadTrackingData(fullPath);
    const migrations: MigrationItem[] = [];

    for (const file of migrationFiles) {
      const parsed = this.parseMigrationFileName(file);
      if (!parsed) {
        continue;
      }

      const status = trackingData[file] ? 'executed' : 'pending';
      const executedAt = trackingData[file]?.executedAt;

      migrations.push({
        label: file,
        status: status as 'pending' | 'executed',
        filePath: path.join(fullPath, file),
        timestamp: parsed.timestamp,
        description: parsed.description,
        executedAt
      });
    }

    // Sort by timestamp (chronological order)
    migrations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return migrations;
  }

  /**
   * Parse migration filename to extract timestamp and description
   */
  private parseMigrationFileName(filename: string): { timestamp: string; description: string } | null {
    const match = filename.match(/^(\d{14})_(.*)\.ts$/);
    if (!match) {
      return null;
    }

    return {
      timestamp: match[1],
      description: match[2]
    };
  }

  /**
   * Load migration tracking data from .migrations.json
   */
  private loadTrackingData(migrationsDir: string): MigrationTracking {
    const trackingFile = path.join(migrationsDir, '.migrations.json');

    if (!fs.existsSync(trackingFile)) {
      return {};
    }

    try {
      const content = fs.readFileSync(trackingFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error loading migration tracking data:', error);
      return {};
    }
  }

  /**
   * Get icon for migration based on status
   */
  private getIcon(element: MigrationItem): vscode.ThemeIcon {
    if (element.status === 'executed') {
      return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
    } else {
      return new vscode.ThemeIcon('clock', new vscode.ThemeColor('testing.iconQueued'));
    }
  }

  /**
   * Get tooltip text for migration
   */
  private getTooltip(element: MigrationItem): string {
    let tooltip = `Migration: ${element.description}\n`;
    tooltip += `Timestamp: ${element.timestamp}\n`;
    tooltip += `Status: ${element.status}`;

    if (element.executedAt) {
      const date = new Date(element.executedAt);
      tooltip += `\nExecuted: ${date.toLocaleString()}`;
    }

    return tooltip;
  }
}
