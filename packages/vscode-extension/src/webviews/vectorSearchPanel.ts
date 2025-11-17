/**
 * Vector Search Panel
 * Webview panel for executing vector similarity searches
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class VectorSearchPanel {
  public static currentPanel: VectorSearchPanel | undefined;
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
          case 'executeSearch':
            this._executeSearch(message.embedding, message.limit, message.threshold);
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

    if (VectorSearchPanel.currentPanel) {
      VectorSearchPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbVectorSearch',
      'Vector Search',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    VectorSearchPanel.currentPanel = new VectorSearchPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    VectorSearchPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _executeSearch(embeddingStr: string, limit: number, threshold: number) {
    try {
      // Parse embedding array
      const embedding = embeddingStr.split(',').map((s: string) => parseFloat(s.trim()));

      if (embedding.some(isNaN)) {
        throw new Error('Invalid embedding values. Please enter comma-separated numbers.');
      }

      const result = await this.queryExecutor.executeVectorSearch({
        embedding,
        limit,
        threshold
      });

      this._panel.webview.postMessage({
        command: 'searchResult',
        result: result
      });
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: 'searchError',
        error: error.message
      });
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Vector Search';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vector Search</title>
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

    .search-form {
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      color: var(--vscode-foreground);
      font-weight: 500;
    }

    .help-text {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    textarea, input {
      width: 100%;
      padding: 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      box-sizing: border-box;
    }

    textarea {
      min-height: 120px;
      resize: vertical;
    }

    input[type="number"] {
      width: 150px;
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

    .result-card {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
    }

    .result-card:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .similarity-score {
      display: inline-block;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .result-metadata {
      color: var(--vscode-descriptionForeground);
      font-size: 13px;
      margin-top: 8px;
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
    <h1>🔍 Vector Similarity Search</h1>

    <div class="search-form">
      <div class="form-group">
        <label for="embeddingInput">Embedding Vector</label>
        <textarea id="embeddingInput" placeholder="Enter comma-separated numbers...
Example:
0.1, 0.2, 0.3, 0.4, 0.5"></textarea>
        <div class="help-text">Enter your embedding as comma-separated numbers (e.g., 0.1, 0.2, 0.3)</div>
      </div>

      <div class="form-group">
        <label for="limitInput">Result Limit</label>
        <input type="number" id="limitInput" value="10" min="1" max="100" />
        <div class="help-text">Maximum number of results to return (1-100)</div>
      </div>

      <div class="form-group">
        <label for="thresholdInput">Similarity Threshold</label>
        <input type="number" id="thresholdInput" value="0.7" min="0" max="1" step="0.1" />
        <div class="help-text">Minimum similarity score (0-1)</div>
      </div>
    </div>

    <div class="button-group">
      <button id="searchBtn">🔍 Search</button>
      <button id="clearBtn">🗑 Clear</button>
    </div>

    <div id="results" class="results" style="display: none;">
      <div class="results-header">
        <h2>Search Results</h2>
        <span id="executionTime" class="execution-time"></span>
      </div>
      <div id="resultsContent"></div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const embeddingInput = document.getElementById('embeddingInput');
    const limitInput = document.getElementById('limitInput');
    const thresholdInput = document.getElementById('thresholdInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const results = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const executionTime = document.getElementById('executionTime');

    searchBtn.addEventListener('click', () => {
      const embedding = embeddingInput.value.trim();
      const limit = parseInt(limitInput.value);
      const threshold = parseFloat(thresholdInput.value);

      if (!embedding) {
        showError('Please enter an embedding vector');
        return;
      }

      searchBtn.disabled = true;
      searchBtn.textContent = '⏳ Searching...';

      vscode.postMessage({
        command: 'executeSearch',
        embedding: embedding,
        limit: limit,
        threshold: threshold
      });
    });

    clearBtn.addEventListener('click', () => {
      embeddingInput.value = '';
      limitInput.value = '10';
      thresholdInput.value = '0.7';
      results.style.display = 'none';
      resultsContent.innerHTML = '';
    });

    window.addEventListener('message', event => {
      const message = event.data;

      searchBtn.disabled = false;
      searchBtn.textContent = '🔍 Search';

      switch (message.command) {
        case 'searchResult':
          showResults(message.result);
          break;
        case 'searchError':
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

      if (result.data && result.data.results && result.data.results.length > 0) {
        let html = '';
        result.data.results.forEach(item => {
          html += \`
            <div class="result-card">
              <div class="similarity-score">Similarity: \${(item.similarity * 100).toFixed(1)}%</div>
              <div><strong>ID:</strong> \${item.id}</div>
              <div class="result-metadata">\${JSON.stringify(item.metadata, null, 2)}</div>
            </div>
          \`;
        });
        resultsContent.innerHTML = html;
      } else {
        resultsContent.innerHTML = '<div class="no-results">No results found matching your criteria.</div>';
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
