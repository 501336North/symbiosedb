/**
 * Query History Panel
 * Webview panel for viewing and re-executing query history
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class QueryHistoryPanel {
  public static currentPanel: QueryHistoryPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private queryExecutor: QueryExecutor
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'refresh':
            this._sendHistory();
            return;
          case 'clearHistory':
            this.queryExecutor.clearHistory();
            this._sendHistory();
            vscode.window.showInformationMessage('Query history cleared');
            return;
          case 'copyQuery':
            vscode.env.clipboard.writeText(message.query);
            vscode.window.showInformationMessage('Query copied to clipboard');
            return;
        }
      },
      null,
      this._disposables
    );

    // Send initial history
    this._sendHistory();
  }

  public static createOrShow(extensionUri: vscode.Uri, queryExecutor: QueryExecutor) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (QueryHistoryPanel.currentPanel) {
      QueryHistoryPanel.currentPanel._panel.reveal(column);
      QueryHistoryPanel.currentPanel._sendHistory();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbQueryHistory',
      'Query History',
      column || vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    QueryHistoryPanel.currentPanel = new QueryHistoryPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    QueryHistoryPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _sendHistory() {
    const history = this.queryExecutor.getQueryHistory();

    this._panel.webview.postMessage({
      command: 'historyData',
      history: history
    });
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Query History';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Query History</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 0;
      margin: 0;
    }

    .header {
      padding: 16px 20px;
      background-color: var(--vscode-editorWidget-background);
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .toolbar {
      display: flex;
      gap: 8px;
    }

    button {
      padding: 6px 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
    }

    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    button.secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    button.secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    button.danger {
      background-color: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
    }

    button.danger:hover {
      opacity: 0.8;
    }

    .filters {
      padding: 12px 20px;
      background-color: var(--vscode-editorWidget-background);
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .filter-group {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .filter-group label {
      font-size: 12px;
      font-weight: 500;
    }

    select {
      padding: 4px 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      font-size: 12px;
    }

    .content {
      padding: 20px;
    }

    .history-item {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 12px;
      transition: background-color 0.2s;
    }

    .history-item:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .history-item.success {
      border-left: 3px solid var(--vscode-testing-iconPassed);
    }

    .history-item.error {
      border-left: 3px solid var(--vscode-testing-iconFailed);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 8px;
    }

    .item-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .query-type {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .query-type.sql {
      background-color: #0078d4;
      color: white;
    }

    .query-type.cypher {
      background-color: #00a82d;
      color: white;
    }

    .query-type.vector {
      background-color: #8b5cf6;
      color: white;
    }

    .query-type.blockchain {
      background-color: #ea580c;
      color: white;
    }

    .item-actions {
      display: flex;
      gap: 6px;
    }

    .item-actions button {
      padding: 4px 10px;
      font-size: 11px;
    }

    .query-text {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background-color: var(--vscode-textCodeBlock-background);
      padding: 8px;
      border-radius: 3px;
      margin-top: 8px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .error-text {
      color: var(--vscode-errorForeground);
      font-size: 11px;
      margin-top: 6px;
      padding: 6px;
      background-color: var(--vscode-inputValidation-errorBackground);
      border-radius: 3px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--vscode-descriptionForeground);
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📜 Query History</h1>
    <div class="toolbar">
      <button id="refreshBtn" class="secondary">🔄 Refresh</button>
      <button id="clearBtn" class="danger">🗑 Clear All</button>
    </div>
  </div>

  <div class="filters">
    <div class="filter-group">
      <label>Type:</label>
      <select id="typeFilter">
        <option value="all">All Types</option>
        <option value="sql">SQL</option>
        <option value="cypher">Cypher</option>
        <option value="vector">Vector</option>
        <option value="blockchain">Blockchain</option>
      </select>
    </div>
    <div class="filter-group">
      <label>Status:</label>
      <select id="statusFilter">
        <option value="all">All</option>
        <option value="success">Success</option>
        <option value="error">Error</option>
      </select>
    </div>
  </div>

  <div class="content">
    <div id="historyList"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let allHistory = [];
    let filteredHistory = [];

    const refreshBtn = document.getElementById('refreshBtn');
    const clearBtn = document.getElementById('clearBtn');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const historyList = document.getElementById('historyList');

    refreshBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'refresh' });
    });

    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all query history?')) {
        vscode.postMessage({ command: 'clearHistory' });
      }
    });

    typeFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'historyData':
          allHistory = message.history || [];
          applyFilters();
          break;
      }
    });

    function applyFilters() {
      const typeValue = typeFilter.value;
      const statusValue = statusFilter.value;

      filteredHistory = allHistory.filter(item => {
        const typeMatch = typeValue === 'all' || item.type === typeValue;
        const statusMatch = statusValue === 'all' ||
          (statusValue === 'success' && item.success) ||
          (statusValue === 'error' && !item.success);

        return typeMatch && statusMatch;
      });

      renderHistory();
    }

    function renderHistory() {
      if (filteredHistory.length === 0) {
        historyList.innerHTML = \`
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div>No queries in history</div>
          </div>
        \`;
        return;
      }

      // Reverse to show newest first
      const sortedHistory = [...filteredHistory].reverse();

      let html = '';
      sortedHistory.forEach((item, index) => {
        const statusClass = item.success ? 'success' : 'error';
        const timestamp = new Date(item.timestamp).toLocaleString();

        html += \`
          <div class="history-item \${statusClass}">
            <div class="item-header">
              <div class="item-meta">
                <span class="query-type \${item.type}">\${item.type}</span>
                <span>⏱ \${item.executionTime}ms</span>
                <span>🕐 \${timestamp}</span>
              </div>
              <div class="item-actions">
                <button class="secondary" onclick="copyQuery(\${index})">📋 Copy</button>
              </div>
            </div>
            <div class="query-text">\${escapeHtml(item.query)}</div>
            \${item.error ? \`<div class="error-text">❌ \${escapeHtml(item.error)}</div>\` : ''}
          </div>
        \`;
      });

      historyList.innerHTML = html;
    }

    function copyQuery(index) {
      const item = filteredHistory[filteredHistory.length - 1 - index];
      vscode.postMessage({
        command: 'copyQuery',
        query: item.query
      });
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Request initial data
    vscode.postMessage({ command: 'refresh' });
  </script>
</body>
</html>`;
  }
}
