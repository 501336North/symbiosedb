/**
 * Enhanced SQL Query Panel
 * Webview panel with Monaco Editor for SQL queries
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class EnhancedSQLQueryPanel {
  public static currentPanel: EnhancedSQLQueryPanel | undefined;
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
          case 'executeQuery':
            this._executeQuery(message.query);
            return;
          case 'formatQuery':
            this._formatQuery(message.query);
            return;
          case 'exportResults':
            this._exportResults(message.data, message.format);
            return;
          case 'saveQuery':
            this._saveQuery(message.query, message.name);
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

    if (EnhancedSQLQueryPanel.currentPanel) {
      EnhancedSQLQueryPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbEnhancedSQLQuery',
      'SQL Query Editor',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    EnhancedSQLQueryPanel.currentPanel = new EnhancedSQLQueryPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    EnhancedSQLQueryPanel.currentPanel = undefined;

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

  private _formatQuery(query: string) {
    // Simple SQL formatting
    const formatted = this._formatSQL(query);

    this._panel.webview.postMessage({
      command: 'formattedQuery',
      query: formatted
    });
  }

  private async _exportResults(data: any, format: 'csv' | 'json') {
    try {
      const uri = await vscode.window.showSaveDialog({
        filters: {
          'CSV': ['csv'],
          'JSON': ['json']
        },
        defaultUri: vscode.Uri.file(`query-results.${format}`)
      });

      if (uri) {
        let content: string;

        if (format === 'csv') {
          content = this._convertToCSV(data);
        } else {
          content = JSON.stringify(data, null, 2);
        }

        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
        vscode.window.showInformationMessage(`Results exported to ${uri.fsPath}`);
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Export failed: ${error.message}`);
    }
  }

  private async _saveQuery(query: string, name: string) {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const queriesDir = vscode.Uri.joinPath(workspaceFolder.uri, 'queries');

      // Create queries directory if it doesn't exist
      try {
        await vscode.workspace.fs.createDirectory(queriesDir);
      } catch {
        // Directory might already exist
      }

      const fileName = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.sql`;
      const fileUri = vscode.Uri.joinPath(queriesDir, fileName);

      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(query, 'utf8'));
      vscode.window.showInformationMessage(`Query saved to ${fileName}`);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Save failed: ${error.message}`);
    }
  }

  private _formatSQL(sql: string): string {
    // Simple SQL formatter
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'INNER JOIN', 'OUTER JOIN', 'ON', 'AND', 'OR', 'ORDER BY',
      'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'UPDATE',
      'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW'
    ];

    let formatted = sql.trim();

    // Add newlines before major keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword.toUpperCase()}`);
    });

    // Clean up whitespace
    formatted = formatted
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    return formatted.trim();
  }

  private _convertToCSV(data: any): string {
    if (!data || !data.rows || data.rows.length === 0) {
      return '';
    }

    const rows = data.rows;
    const columns = Object.keys(rows[0]);

    // Header
    let csv = columns.join(',') + '\n';

    // Rows
    rows.forEach((row: any) => {
      const values = columns.map(col => {
        const value = row[col];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });

    return csv;
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'SQL Query Editor';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SQL Query Editor</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/editor/editor.main.min.css">
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .header {
      padding: 12px 20px;
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
      display: flex;
      align-items: center;
      gap: 4px;
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

    .editor-container {
      flex: 0 0 300px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    #editor {
      width: 100%;
      height: 300px;
    }

    .results-container {
      flex: 1;
      overflow: auto;
      padding: 20px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .results-header h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .execution-time {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th {
      background-color: var(--vscode-editorWidget-background);
      color: var(--vscode-foreground);
      padding: 8px 12px;
      text-align: left;
      border-bottom: 2px solid var(--vscode-panel-border);
      font-weight: 600;
      position: sticky;
      top: 0;
    }

    td {
      padding: 6px 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    tr:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .error {
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      color: var(--vscode-errorForeground);
      padding: 12px;
      border-radius: 4px;
      margin-top: 12px;
    }

    .no-results {
      color: var(--vscode-descriptionForeground);
      text-align: center;
      padding: 40px;
    }

    .export-buttons {
      display: flex;
      gap: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🗄️ SQL Query Editor</h1>
    <div class="toolbar">
      <button id="formatBtn" class="secondary" title="Format SQL">⚡ Format</button>
      <button id="saveBtn" class="secondary" title="Save Query">💾 Save</button>
      <button id="executeBtn" title="Execute Query">▶ Execute</button>
    </div>
  </div>

  <div class="editor-container">
    <div id="editor"></div>
  </div>

  <div id="results" class="results-container" style="display: none;">
    <div class="results-header">
      <h2>Results</h2>
      <div style="display: flex; align-items: center; gap: 16px;">
        <span id="executionTime" class="execution-time"></span>
        <div class="export-buttons">
          <button id="exportCsvBtn" class="secondary">📊 Export CSV</button>
          <button id="exportJsonBtn" class="secondary">📄 Export JSON</button>
        </div>
      </div>
    </div>
    <div id="resultsContent"></div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js"></script>
  <script>
    const vscode = acquireVsCodeApi();
    let editor;
    let currentResults = null;

    // Load Monaco Editor
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });

    require(['vs/editor/editor.main'], function () {
      editor = monaco.editor.create(document.getElementById('editor'), {
        value: 'SELECT * FROM users LIMIT 10;',
        language: 'sql',
        theme: document.body.classList.contains('vscode-dark') ? 'vs-dark' : 'vs',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        scrollBeyondLastLine: false
      });

      // Keyboard shortcut: Cmd/Ctrl+Enter to execute
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
        executeQuery();
      });
    });

    const executeBtn = document.getElementById('executeBtn');
    const formatBtn = document.getElementById('formatBtn');
    const saveBtn = document.getElementById('saveBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const results = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const executionTime = document.getElementById('executionTime');

    executeBtn.addEventListener('click', executeQuery);

    formatBtn.addEventListener('click', () => {
      const query = editor.getValue();
      vscode.postMessage({
        command: 'formatQuery',
        query: query
      });
    });

    saveBtn.addEventListener('click', async () => {
      const query = editor.getValue();
      const name = prompt('Enter query name:');
      if (name) {
        vscode.postMessage({
          command: 'saveQuery',
          query: query,
          name: name
        });
      }
    });

    exportCsvBtn.addEventListener('click', () => {
      if (currentResults) {
        vscode.postMessage({
          command: 'exportResults',
          data: currentResults,
          format: 'csv'
        });
      }
    });

    exportJsonBtn.addEventListener('click', () => {
      if (currentResults) {
        vscode.postMessage({
          command: 'exportResults',
          data: currentResults,
          format: 'json'
        });
      }
    });

    function executeQuery() {
      const query = editor.getValue().trim();
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
    }

    window.addEventListener('message', event => {
      const message = event.data;

      executeBtn.disabled = false;
      executeBtn.textContent = '▶ Execute';

      switch (message.command) {
        case 'queryResult':
          showResults(message.result);
          break;
        case 'queryError':
          showError(message.error);
          break;
        case 'formattedQuery':
          editor.setValue(message.query);
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
        currentResults = result.data;
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
        currentResults = null;
        resultsContent.innerHTML = '<div class="no-results">Query executed successfully, but returned no results.</div>';
      }
    }

    function showError(error) {
      results.style.display = 'block';
      currentResults = null;
      resultsContent.innerHTML = \`<div class="error">❌ Error: \${error}</div>\`;
    }
  </script>
</body>
</html>`;
  }
}
