/**
 * Graph Query Panel
 * Webview panel for executing Cypher/Apache AGE graph queries
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class GraphQueryPanel {
  public static currentPanel: GraphQueryPanel | undefined;
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

    if (GraphQueryPanel.currentPanel) {
      GraphQueryPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbGraphQuery',
      'Graph Query',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    GraphQueryPanel.currentPanel = new GraphQueryPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    GraphQueryPanel.currentPanel = undefined;

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

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Graph Query';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Graph Query</title>
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

    .help-text {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 8px;
    }

    .examples {
      margin-bottom: 20px;
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 15px;
    }

    .examples h3 {
      margin-top: 0;
      color: var(--vscode-foreground);
    }

    .example-query {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background-color: var(--vscode-textCodeBlock-background);
      padding: 8px;
      border-radius: 4px;
      margin: 8px 0;
      cursor: pointer;
    }

    .example-query:hover {
      background-color: var(--vscode-list-hoverBackground);
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

    .graph-section {
      margin-bottom: 20px;
    }

    .node-card, .relationship-card {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .node-card {
      border-left: 4px solid var(--vscode-button-background);
    }

    .relationship-card {
      border-left: 4px solid var(--vscode-testing-iconPassed);
    }

    .card-title {
      font-weight: bold;
      margin-bottom: 8px;
    }

    .card-content {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .error {
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      color: var(--vscode-errorForeground);
      padding: 10px;
      border-radius: 4px;
      margin-top: 10px;
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
    <h1>🕸️ Graph Query (Cypher / Apache AGE)</h1>

    <div class="examples">
      <h3>Example Queries (click to use)</h3>
      <div class="example-query" data-query="MATCH (n:User) RETURN n LIMIT 10">
        Get all users: <code>MATCH (n:User) RETURN n LIMIT 10</code>
      </div>
      <div class="example-query" data-query="MATCH (u:User)-[r:FOLLOWS]->(p:User) RETURN u, r, p">
        Get relationships: <code>MATCH (u:User)-[r:FOLLOWS]->(p:User) RETURN u, r, p</code>
      </div>
      <div class="example-query" data-query="MATCH (u:User {name: 'Alice'})-[r]->(n) RETURN u, r, n">
        Find user connections: <code>MATCH (u:User {name: 'Alice'})-[r]->(n) RETURN u, r, n</code>
      </div>
    </div>

    <div class="query-editor">
      <textarea id="queryInput" placeholder="Enter your Cypher query here...
Example:
MATCH (n:User) RETURN n LIMIT 10"></textarea>
      <div class="help-text">Enter Cypher queries for Apache AGE graph database</div>
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

    // Example query click handlers
    document.querySelectorAll('.example-query').forEach(element => {
      element.addEventListener('click', () => {
        queryInput.value = element.getAttribute('data-query');
      });
    });

    executeBtn.addEventListener('click', () => {
      const query = queryInput.value.trim();
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

      if (result.data) {
        let html = '';

        // Display nodes
        if (result.data.nodes && result.data.nodes.length > 0) {
          html += '<div class="graph-section"><h3>Nodes (\${result.data.nodes.length})</h3>';
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
          html += '<div class="graph-section"><h3>Relationships (\${result.data.relationships.length})</h3>';
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
