/**
 * Enhanced Graph Query Panel
 * Webview panel with Monaco Editor for Cypher queries
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class EnhancedGraphQueryPanel {
  public static currentPanel: EnhancedGraphQueryPanel | undefined;
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
          case 'loadTemplate':
            this._panel.webview.postMessage({
              command: 'setQuery',
              query: this._getQueryTemplate(message.template)
            });
            return;
          case 'saveQuery':
            this._saveQuery(message.query, message.name);
            return;
          case 'exportResults':
            this._exportResults(message.data, message.format);
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

    if (EnhancedGraphQueryPanel.currentPanel) {
      EnhancedGraphQueryPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbEnhancedGraphQuery',
      'Graph Query Editor',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    EnhancedGraphQueryPanel.currentPanel = new EnhancedGraphQueryPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    EnhancedGraphQueryPanel.currentPanel = undefined;

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
      const result = await this.queryExecutor.executeCypher(query);

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

  private async _saveQuery(query: string, name: string) {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const queriesDir = vscode.Uri.joinPath(workspaceFolder.uri, 'queries');

      try {
        await vscode.workspace.fs.createDirectory(queriesDir);
      } catch {
        // Directory might already exist
      }

      const fileName = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.cypher`;
      const fileUri = vscode.Uri.joinPath(queriesDir, fileName);

      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(query, 'utf8'));
      vscode.window.showInformationMessage(`Query saved to ${fileName}`);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Save failed: ${error.message}`);
    }
  }

  private async _exportResults(data: any, format: 'json') {
    try {
      const uri = await vscode.window.showSaveDialog({
        filters: {
          'JSON': ['json']
        },
        defaultUri: vscode.Uri.file(`graph-results.json`)
      });

      if (uri) {
        const content = JSON.stringify(data, null, 2);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
        vscode.window.showInformationMessage(`Results exported to ${uri.fsPath}`);
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Export failed: ${error.message}`);
    }
  }

  private _getQueryTemplate(template: string): string {
    const templates: { [key: string]: string } = {
      'all-nodes': 'MATCH (n)\nRETURN n\nLIMIT 25',
      'all-relationships': 'MATCH (a)-[r]->(b)\nRETURN a, r, b\nLIMIT 25',
      'specific-label': 'MATCH (n:User)\nRETURN n\nLIMIT 25',
      'path-query': 'MATCH path = (start)-[*1..3]->(end)\nWHERE start.name = "Alice"\nRETURN path\nLIMIT 10',
      'create-node': 'CREATE (n:Person {name: "Alice", age: 30})\nRETURN n',
      'create-relationship': 'MATCH (a:Person {name: "Alice"}), (b:Person {name: "Bob"})\nCREATE (a)-[r:KNOWS]->(b)\nRETURN r',
      'delete-nodes': 'MATCH (n:Person {name: "Alice"})\nDETACH DELETE n',
      'count-nodes': 'MATCH (n:Person)\nRETURN count(n) as count',
      'shortest-path': 'MATCH (start:Person {name: "Alice"}), (end:Person {name: "Bob"}),\n  path = shortestPath((start)-[*]-(end))\nRETURN path'
    };

    return templates[template] || '';
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Graph Query Editor';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Graph Query Editor</title>
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

    .templates-bar {
      padding: 12px 20px;
      background-color: var(--vscode-editorWidget-background);
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .templates-bar label {
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
    }

    .template-btn {
      padding: 4px 10px;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }

    .template-btn:hover {
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

    .graph-section {
      margin-bottom: 20px;
    }

    .graph-section h3 {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 10px;
      color: var(--vscode-foreground);
    }

    .node-card, .relationship-card {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 8px;
      font-size: 12px;
    }

    .node-card {
      border-left: 3px solid var(--vscode-button-background);
    }

    .relationship-card {
      border-left: 3px solid var(--vscode-testing-iconPassed);
    }

    .card-title {
      font-weight: 600;
      margin-bottom: 6px;
    }

    .card-content {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      white-space: pre-wrap;
    }

    .error {
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      color: var(--vscode-errorForeground);
      padding: 12px;
      border-radius: 4px;
    }

    .no-results {
      color: var(--vscode-descriptionForeground);
      text-align: center;
      padding: 40px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🕸️ Graph Query Editor (Cypher)</h1>
    <div class="toolbar">
      <button id="saveBtn" class="secondary">💾 Save</button>
      <button id="exportBtn" class="secondary">📄 Export JSON</button>
      <button id="executeBtn">▶ Execute</button>
    </div>
  </div>

  <div class="templates-bar">
    <label>Query Templates:</label>
    <button class="template-btn" data-template="all-nodes">All Nodes</button>
    <button class="template-btn" data-template="all-relationships">All Relationships</button>
    <button class="template-btn" data-template="specific-label">Specific Label</button>
    <button class="template-btn" data-template="path-query">Path Query</button>
    <button class="template-btn" data-template="create-node">Create Node</button>
    <button class="template-btn" data-template="create-relationship">Create Relationship</button>
    <button class="template-btn" data-template="shortest-path">Shortest Path</button>
  </div>

  <div class="editor-container">
    <div id="editor"></div>
  </div>

  <div id="results" class="results-container" style="display: none;">
    <div class="results-header">
      <h2>Results</h2>
      <span id="executionTime" class="execution-time"></span>
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
        value: 'MATCH (n)\\nRETURN n\\nLIMIT 25',
        language: 'cypher',
        theme: document.body.classList.contains('vscode-dark') ? 'vs-dark' : 'vs',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        scrollBeyondLastLine: false
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
        executeQuery();
      });
    });

    const executeBtn = document.getElementById('executeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportBtn');
    const results = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const executionTime = document.getElementById('executionTime');

    executeBtn.addEventListener('click', executeQuery);

    saveBtn.addEventListener('click', () => {
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

    exportBtn.addEventListener('click', () => {
      if (currentResults) {
        vscode.postMessage({
          command: 'exportResults',
          data: currentResults,
          format: 'json'
        });
      }
    });

    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        vscode.postMessage({
          command: 'loadTemplate',
          template: btn.dataset.template
        });
      });
    });

    function executeQuery() {
      const query = editor.getValue().trim();
      if (!query) {
        showError('Please enter a Cypher query');
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
        case 'setQuery':
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

      if (result.data) {
        currentResults = result.data;
        let html = '';

        // Display nodes
        if (result.data.nodes && result.data.nodes.length > 0) {
          html += '<div class="graph-section">';
          html += \`<h3>Nodes (\${result.data.nodes.length})</h3>\`;
          result.data.nodes.forEach(node => {
            html += \`
              <div class="node-card">
                <div class="card-title">Node #\${node.id} - \${node.label}</div>
                <div class="card-content">\${JSON.stringify(node.properties, null, 2)}</div>
              </div>
            \`;
          });
          html += '</div>';
        }

        // Display relationships
        if (result.data.relationships && result.data.relationships.length > 0) {
          html += '<div class="graph-section">';
          html += \`<h3>Relationships (\${result.data.relationships.length})</h3>\`;
          result.data.relationships.forEach(rel => {
            html += \`
              <div class="relationship-card">
                <div class="card-title">[\${rel.type}] Node #\${rel.from} → Node #\${rel.to}</div>
              </div>
            \`;
          });
          html += '</div>';
        }

        if (html) {
          resultsContent.innerHTML = html;
        } else {
          resultsContent.innerHTML = '<div class="no-results">Query executed successfully, but returned no results.</div>';
        }
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
