/**
 * SQL Query Panel
 * Webview panel for executing SQL queries
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class SQLQueryPanel {
  public static currentPanel: SQLQueryPanel | undefined;
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

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'executeQuery':
            this._executeQuery(message.query);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(extensionUri: vscode.Uri, queryExecutor: QueryExecutor) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (SQLQueryPanel.currentPanel) {
      SQLQueryPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'symbiosedbSQLQuery',
      'SQL Query',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    SQLQueryPanel.currentPanel = new SQLQueryPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    SQLQueryPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _executeQuery(query: string) {
    try {
      const result = await this.queryExecutor.executeSQL(query);

      this._panel.webview.postMessage({
        command: 'queryResult',
        result: result
      });
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: 'queryError',
        error: error.message
      });
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'SQL Query';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SQL Query</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: var(--vscode-foreground);
      margin-bottom: 20px;
    }

    .query-editor {
      margin-bottom: 20px;
    }

    textarea {
      width: 100%;
      min-height: 200px;
      padding: 10px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      resize: vertical;
    }

    .button-group {
      margin-bottom: 20px;
    }

    button {
      padding: 8px 16px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
    }

    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .results {
      margin-top: 20px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .execution-time {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      background-color: var(--vscode-editor-background);
    }

    th {
      background-color: var(--vscode-editorWidget-background);
      color: var(--vscode-foreground);
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid var(--vscode-panel-border);
    }

    td {
      padding: 8px 10px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    tr:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .error {
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      color: var(--vscode-errorForeground);
      padding: 10px;
      border-radius: 4px;
      margin-top: 10px;
    }

    .success {
      color: var(--vscode-testing-iconPassed);
    }

    .no-results {
      color: var(--vscode-descriptionForeground);
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🗄️ SQL Query</h1>

    <div class="query-editor">
      <textarea id="queryInput" placeholder="Enter your SQL query here...
Example:
SELECT * FROM users LIMIT 10;"></textarea>
    </div>

    <div class="button-group">
      <button id="executeBtn">▶ Execute Query</button>
      <button id="clearBtn">🗑 Clear</button>
    </div>

    <div id="results" class="results" style="display: none;">
      <div class="results-header">
        <h2>Results</h2>
        <span id="executionTime" class="execution-time"></span>
      </div>
      <div id="resultsContent"></div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const queryInput = document.getElementById('queryInput');
    const executeBtn = document.getElementById('executeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const results = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const executionTime = document.getElementById('executionTime');

    executeBtn.addEventListener('click', () => {
      const query = queryInput.value.trim();
      if (!query) {
        showError('Please enter a SQL query');
        return;
      }

      executeBtn.disabled = true;
      executeBtn.textContent = '⏳ Executing...';

      vscode.postMessage({
        command: 'executeQuery',
        query: query
      });
    });

    clearBtn.addEventListener('click', () => {
      queryInput.value = '';
      results.style.display = 'none';
      resultsContent.innerHTML = '';
    });

    window.addEventListener('message', event => {
      const message = event.data;

      executeBtn.disabled = false;
      executeBtn.textContent = '▶ Execute Query';

      switch (message.command) {
        case 'queryResult':
          showResults(message.result);
          break;
        case 'queryError':
          showError(message.error);
          break;
      }
    });

    function showResults(result) {
      results.style.display = 'block';
      executionTime.textContent = \`Executed in \${result.executionTime}ms\`;

      if (!result.success) {
        showError(result.error);
        return;
      }

      if (result.data && result.data.rows && result.data.rows.length > 0) {
        const rows = result.data.rows;
        const columns = Object.keys(rows[0]);

        let html = '<table>';
        html += '<thead><tr>';
        columns.forEach(col => {
          html += \`<th>\${col}</th>\`;
        });
        html += '</tr></thead>';
        html += '<tbody>';
        rows.forEach(row => {
          html += '<tr>';
          columns.forEach(col => {
            html += \`<td>\${row[col]}</td>\`;
          });
          html += '</tr>';
        });
        html += '</tbody></table>';

        resultsContent.innerHTML = html;
      } else {
        resultsContent.innerHTML = '<div class="no-results">Query executed successfully, but returned no results.</div>';
      }
    }

    function showError(error) {
      results.style.display = 'block';
      resultsContent.innerHTML = \`<div class="error">❌ Error: \${error}</div>\`;
    }
  </script>
</body>
</html>`;
  }
}
