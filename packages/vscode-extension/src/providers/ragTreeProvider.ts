/**
 * RAG Tree Provider
 * Displays indexed documents in the RAG view
 */

import * as vscode from 'vscode';

export class RAGDocument extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly metadata: any,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(title, collapsibleState);
    this.tooltip = this.getTooltip();
    this.description = this.getDescription();
    this.contextValue = 'ragDocument';
    this.iconPath = new vscode.ThemeIcon('file-text');
  }

  private getTooltip(): string {
    const lines = [
      `Document ID: ${this.id}`,
      `Title: ${this.title}`
    ];

    if (this.metadata) {
      if (this.metadata.author) {
        lines.push(`Author: ${this.metadata.author}`);
      }
      if (this.metadata.createdAt) {
        const date = new Date(this.metadata.createdAt);
        lines.push(`Created: ${date.toLocaleString()}`);
      }
      if (this.metadata.chunks) {
        lines.push(`Chunks: ${this.metadata.chunks}`);
      }
    }

    return lines.join('\n');
  }

  private getDescription(): string {
    if (this.metadata && this.metadata.chunks) {
      return `${this.metadata.chunks} chunks`;
    }
    return '';
  }
}

export class RAGTreeProvider implements vscode.TreeDataProvider<RAGDocument> {
  private _onDidChangeTreeData: vscode.EventEmitter<RAGDocument | undefined | void> = new vscode.EventEmitter<RAGDocument | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<RAGDocument | undefined | void> = this._onDidChangeTreeData.event;

  private documents: RAGDocument[] = [];
  private connected: boolean = false;

  constructor() {
    this.loadDocuments();
  }

  refresh(): void {
    this.loadDocuments();
    this._onDidChangeTreeData.fire();
  }

  setConnection(connected: boolean): void {
    this.connected = connected;
    if (connected) {
      this.loadDocuments();
    } else {
      this.documents = [];
    }
    this.refresh();
  }

  private async loadDocuments(): Promise<void> {
    if (!this.connected) {
      this.documents = [];
      return;
    }

    // In a real implementation, this would fetch from the API
    // For now, we'll use mock data
    this.documents = [
      new RAGDocument(
        'doc-1',
        'Getting Started with SymbioseDB',
        {
          author: 'Documentation Team',
          createdAt: new Date().toISOString(),
          chunks: 12
        }
      ),
      new RAGDocument(
        'doc-2',
        'API Reference Guide',
        {
          author: 'Engineering Team',
          createdAt: new Date().toISOString(),
          chunks: 24
        }
      ),
      new RAGDocument(
        'doc-3',
        'Best Practices',
        {
          author: 'Community',
          createdAt: new Date().toISOString(),
          chunks: 8
        }
      )
    ];
  }

  getTreeItem(element: RAGDocument): vscode.TreeItem {
    return element;
  }

  getChildren(element?: RAGDocument): Thenable<RAGDocument[]> {
    if (!this.connected) {
      return Promise.resolve([]);
    }

    if (element) {
      // No children for documents
      return Promise.resolve([]);
    } else {
      // Root level - return all documents
      return Promise.resolve(this.documents);
    }
  }

  async addDocument(document: RAGDocument): Promise<void> {
    this.documents.push(document);
    this.refresh();
  }

  async removeDocument(documentId: string): Promise<void> {
    this.documents = this.documents.filter(doc => doc.id !== documentId);
    this.refresh();
  }

  getDocuments(): RAGDocument[] {
    return this.documents;
  }
}
