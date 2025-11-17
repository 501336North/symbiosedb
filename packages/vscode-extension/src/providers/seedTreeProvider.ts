/**
 * Seed Tree Provider
 * Displays database seeds in VS Code tree view
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface SeedItem {
  label: string;
  filePath: string;
  sequence: string;
  description: string;
}

export class SeedTreeProvider implements vscode.TreeDataProvider<SeedItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SeedItem | undefined | null | void> =
    new vscode.EventEmitter<SeedItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SeedItem | undefined | null | void> =
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
  getTreeItem(element: SeedItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      vscode.TreeItemCollapsibleState.None
    );

    treeItem.contextValue = 'seed';
    treeItem.tooltip = this.getTooltip(element);
    treeItem.description = element.description;
    treeItem.iconPath = new vscode.ThemeIcon('file-code');
    treeItem.command = {
      command: 'symbiosedb.seed.openFile',
      title: 'Open Seed File',
      arguments: [element]
    };

    return treeItem;
  }

  /**
   * Get children (seeds) for the tree view
   */
  async getChildren(element?: SeedItem): Promise<SeedItem[]> {
    if (element) {
      return [];
    }

    const config = vscode.workspace.getConfiguration('symbiosedb');
    const seedsDir = config.get<string>('paths.seedsDir', './seeds');
    const fullPath = path.join(this.workspaceRoot, seedsDir);

    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const files = fs.readdirSync(fullPath);
    const seedFiles = files.filter((file) =>
      /^\d{2}_.*\.ts$/.test(file)
    );

    const seeds: SeedItem[] = [];

    for (const file of seedFiles) {
      const parsed = this.parseSeedFileName(file);
      if (!parsed) {
        continue;
      }

      seeds.push({
        label: file,
        filePath: path.join(fullPath, file),
        sequence: parsed.sequence,
        description: parsed.description
      });
    }

    // Sort by sequence number
    seeds.sort((a, b) => {
      const seqA = parseInt(a.sequence, 10);
      const seqB = parseInt(b.sequence, 10);
      return seqA - seqB;
    });

    return seeds;
  }

  /**
   * Parse seed filename to extract sequence and description
   */
  private parseSeedFileName(filename: string): { sequence: string; description: string } | null {
    const match = filename.match(/^(\d{2})_(.*)\.ts$/);
    if (!match) {
      return null;
    }

    return {
      sequence: match[1],
      description: match[2]
    };
  }

  /**
   * Get tooltip text for seed
   */
  private getTooltip(element: SeedItem): string {
    return `Seed: ${element.description}\nSequence: ${element.sequence}`;
  }
}
