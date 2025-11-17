/**
 * Database Tree Provider
 * Displays all 4 databases (PostgreSQL, Vector, Graph, Blockchain) in VS Code tree view
 */

import * as vscode from 'vscode';

export type DatabaseType = 'postgresql' | 'vector' | 'graph' | 'blockchain';

export interface DatabaseItem {
  label: string;
  type: 'database' | 'category' | 'table' | 'collection' | 'node' | 'relationship' | 'attestation' | 'column';
  databaseType: DatabaseType;
  contextValue: string;
  collapsibleState: vscode.TreeItemCollapsibleState;

  // Optional properties for specific item types
  tableName?: string;
  collectionName?: string;
  nodeLabel?: string;
  relationshipType?: string;
  attestationId?: string;
  columnName?: string;
  columnType?: string;
  category?: string;
}

export class DatabaseTreeProvider implements vscode.TreeDataProvider<DatabaseItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DatabaseItem | undefined | null | void> =
    new vscode.EventEmitter<DatabaseItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<DatabaseItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private isConnected: boolean = false;

  constructor() {}

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Set connection status
   */
  setConnection(connected: boolean): void {
    this.isConnected = connected;
    this.refresh();
  }

  /**
   * Get tree item representation for VS Code
   */
  getTreeItem(element: DatabaseItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      element.collapsibleState
    );

    treeItem.contextValue = element.contextValue;
    treeItem.tooltip = this.getTooltip(element);
    treeItem.iconPath = this.getIcon(element);

    // Add commands for clickable items
    if (element.type === 'table') {
      treeItem.command = {
        command: 'symbiosedb.database.showTableData',
        title: 'Show Table Data',
        arguments: [element]
      };
    } else if (element.type === 'collection') {
      treeItem.command = {
        command: 'symbiosedb.database.showCollectionData',
        title: 'Show Collection Data',
        arguments: [element]
      };
    }

    return treeItem;
  }

  /**
   * Get children for the tree view
   */
  async getChildren(element?: DatabaseItem): Promise<DatabaseItem[]> {
    if (!element) {
      // Root level: show all 4 database types
      return this.getRootDatabases();
    }

    // Expand based on element type
    switch (element.type) {
      case 'database':
        return this.getDatabaseCategories(element.databaseType);

      case 'category':
        return this.getCategoryChildren(element);

      case 'table':
        return this.getTableColumns(element);

      default:
        return [];
    }
  }

  /**
   * Get root database items (4 databases)
   */
  private getRootDatabases(): DatabaseItem[] {
    const connectionIcon = this.isConnected ? '🟢' : '🔴';

    return [
      {
        label: `${connectionIcon} PostgreSQL`,
        type: 'database',
        databaseType: 'postgresql',
        contextValue: 'database-postgresql',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      },
      {
        label: `${connectionIcon} Vector (pgvector)`,
        type: 'database',
        databaseType: 'vector',
        contextValue: 'database-vector',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      },
      {
        label: `${connectionIcon} Graph (Apache AGE)`,
        type: 'database',
        databaseType: 'graph',
        contextValue: 'database-graph',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      },
      {
        label: `${connectionIcon} Blockchain (Ethereum L2)`,
        type: 'database',
        databaseType: 'blockchain',
        contextValue: 'database-blockchain',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      }
    ];
  }

  /**
   * Get categories for a specific database type
   */
  private getDatabaseCategories(databaseType: DatabaseType): DatabaseItem[] {
    switch (databaseType) {
      case 'postgresql':
        return [
          {
            label: 'Tables',
            type: 'category',
            databaseType: 'postgresql',
            contextValue: 'category-tables',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            category: 'tables'
          },
          {
            label: 'Schemas',
            type: 'category',
            databaseType: 'postgresql',
            contextValue: 'category-schemas',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            category: 'schemas'
          },
          {
            label: 'Views',
            type: 'category',
            databaseType: 'postgresql',
            contextValue: 'category-views',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            category: 'views'
          }
        ];

      case 'vector':
        return [
          {
            label: 'Collections',
            type: 'category',
            databaseType: 'vector',
            contextValue: 'category-collections',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            category: 'collections'
          },
          {
            label: 'Embeddings',
            type: 'category',
            databaseType: 'vector',
            contextValue: 'category-embeddings',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            category: 'embeddings'
          }
        ];

      case 'graph':
        return [
          {
            label: 'Nodes',
            type: 'category',
            databaseType: 'graph',
            contextValue: 'category-nodes',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            category: 'nodes'
          },
          {
            label: 'Relationships',
            type: 'category',
            databaseType: 'graph',
            contextValue: 'category-relationships',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            category: 'relationships'
          }
        ];

      case 'blockchain':
        return [
          {
            label: 'Attestations',
            type: 'category',
            databaseType: 'blockchain',
            contextValue: 'category-attestations',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            category: 'attestations'
          },
          {
            label: 'Transactions',
            type: 'category',
            databaseType: 'blockchain',
            contextValue: 'category-transactions',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            category: 'transactions'
          }
        ];

      default:
        return [];
    }
  }

  /**
   * Get children for a category
   */
  private async getCategoryChildren(element: DatabaseItem): Promise<DatabaseItem[]> {
    if (!this.isConnected) {
      return [this.getNotConnectedItem(element.databaseType)];
    }

    const category = element.category || '';

    switch (category) {
      case 'tables':
        return this.fetchPostgresTables();

      case 'collections':
        return this.fetchVectorCollections();

      case 'nodes':
        return this.fetchGraphNodes();

      case 'relationships':
        return this.fetchGraphRelationships();

      case 'attestations':
        return this.fetchBlockchainAttestations();

      default:
        return [];
    }
  }

  /**
   * Get columns for a table
   */
  private async getTableColumns(element: DatabaseItem): Promise<DatabaseItem[]> {
    if (!this.isConnected || !element.tableName) {
      return [];
    }

    // Fetch columns for the table
    return this.fetchTableColumns(element.tableName);
  }

  /**
   * Fetch PostgreSQL tables
   */
  private async fetchPostgresTables(): Promise<DatabaseItem[]> {
    // In a real implementation, this would query the database
    // For now, return mock data
    return [
      {
        label: 'users',
        type: 'table',
        databaseType: 'postgresql',
        contextValue: 'table',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        tableName: 'users'
      },
      {
        label: 'posts',
        type: 'table',
        databaseType: 'postgresql',
        contextValue: 'table',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        tableName: 'posts'
      },
      {
        label: 'comments',
        type: 'table',
        databaseType: 'postgresql',
        contextValue: 'table',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        tableName: 'comments'
      }
    ];
  }

  /**
   * Fetch table columns
   */
  private async fetchTableColumns(tableName: string): Promise<DatabaseItem[]> {
    // Mock column data
    const mockColumns: Record<string, DatabaseItem[]> = {
      users: [
        {
          label: 'id (SERIAL)',
          type: 'column',
          databaseType: 'postgresql',
          contextValue: 'column',
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          columnName: 'id',
          columnType: 'SERIAL'
        },
        {
          label: 'email (VARCHAR)',
          type: 'column',
          databaseType: 'postgresql',
          contextValue: 'column',
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          columnName: 'email',
          columnType: 'VARCHAR'
        },
        {
          label: 'name (VARCHAR)',
          type: 'column',
          databaseType: 'postgresql',
          contextValue: 'column',
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          columnName: 'name',
          columnType: 'VARCHAR'
        }
      ]
    };

    return mockColumns[tableName] || [];
  }

  /**
   * Fetch Vector collections
   */
  private async fetchVectorCollections(): Promise<DatabaseItem[]> {
    return [
      {
        label: 'user_embeddings',
        type: 'collection',
        databaseType: 'vector',
        contextValue: 'collection',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        collectionName: 'user_embeddings'
      },
      {
        label: 'document_embeddings',
        type: 'collection',
        databaseType: 'vector',
        contextValue: 'collection',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        collectionName: 'document_embeddings'
      }
    ];
  }

  /**
   * Fetch Graph nodes
   */
  private async fetchGraphNodes(): Promise<DatabaseItem[]> {
    return [
      {
        label: 'User',
        type: 'node',
        databaseType: 'graph',
        contextValue: 'node',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        nodeLabel: 'User'
      },
      {
        label: 'Post',
        type: 'node',
        databaseType: 'graph',
        contextValue: 'node',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        nodeLabel: 'Post'
      },
      {
        label: 'Comment',
        type: 'node',
        databaseType: 'graph',
        contextValue: 'node',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        nodeLabel: 'Comment'
      }
    ];
  }

  /**
   * Fetch Graph relationships
   */
  private async fetchGraphRelationships(): Promise<DatabaseItem[]> {
    return [
      {
        label: 'FOLLOWS',
        type: 'relationship',
        databaseType: 'graph',
        contextValue: 'relationship',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        relationshipType: 'FOLLOWS'
      },
      {
        label: 'AUTHORED',
        type: 'relationship',
        databaseType: 'graph',
        contextValue: 'relationship',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        relationshipType: 'AUTHORED'
      },
      {
        label: 'COMMENTED_ON',
        type: 'relationship',
        databaseType: 'graph',
        contextValue: 'relationship',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        relationshipType: 'COMMENTED_ON'
      }
    ];
  }

  /**
   * Fetch Blockchain attestations
   */
  private async fetchBlockchainAttestations(): Promise<DatabaseItem[]> {
    return [
      {
        label: 'Latest 10 Attestations',
        type: 'attestation',
        databaseType: 'blockchain',
        contextValue: 'attestation',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        attestationId: 'latest'
      }
    ];
  }

  /**
   * Get "Not Connected" placeholder item
   */
  private getNotConnectedItem(databaseType: DatabaseType): DatabaseItem {
    return {
      label: 'Not connected. Click "Connect" to view.',
      type: 'category',
      databaseType,
      contextValue: 'not-connected',
      collapsibleState: vscode.TreeItemCollapsibleState.None
    };
  }

  /**
   * Get icon for database item
   */
  private getIcon(element: DatabaseItem): vscode.ThemeIcon {
    switch (element.type) {
      case 'database':
        return new vscode.ThemeIcon('database');
      case 'category':
        return new vscode.ThemeIcon('folder');
      case 'table':
        return new vscode.ThemeIcon('table');
      case 'collection':
        return new vscode.ThemeIcon('files');
      case 'node':
        return new vscode.ThemeIcon('circle-filled');
      case 'relationship':
        return new vscode.ThemeIcon('arrow-right');
      case 'attestation':
        return new vscode.ThemeIcon('shield');
      case 'column':
        return new vscode.ThemeIcon('symbol-field');
      default:
        return new vscode.ThemeIcon('question');
    }
  }

  /**
   * Get tooltip for database item
   */
  private getTooltip(element: DatabaseItem): string {
    switch (element.type) {
      case 'database':
        return `${element.label} - ${this.isConnected ? 'Connected' : 'Disconnected'}`;
      case 'table':
        return `Table: ${element.tableName}`;
      case 'collection':
        return `Vector Collection: ${element.collectionName}`;
      case 'node':
        return `Graph Node Type: ${element.nodeLabel}`;
      case 'relationship':
        return `Graph Relationship: ${element.relationshipType}`;
      case 'column':
        return `${element.columnName}: ${element.columnType}`;
      default:
        return element.label;
    }
  }
}
