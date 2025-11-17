/**
 * RAG Query Panel
 * Semantic search and question answering
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class RAGQueryPanel {
  public static currentPanel: RAGQueryPanel | undefined;
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
            this._executeQuery(message.query, message.limit);
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

    if (RAGQueryPanel.currentPanel) {
      RAGQueryPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbRAGQuery',
      'RAG Query',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    RAGQueryPanel.currentPanel = new RAGQueryPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    RAGQueryPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _executeQuery(query: string, limit: number) {
    try {
      // Simulate RAG query with mock results
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockResults = {
        answer: this._generateMockAnswer(query),
        sources: [
          {
            content: 'SymbioseDB is a unified multi-database platform that combines PostgreSQL, Vector Search, Graph Database, and Blockchain into one API.',
            metadata: {
              title: 'Getting Started with SymbioseDB',
              author: 'Documentation Team',
              score: 0.95
            }
          },
          {
            content: 'The RAG system allows you to index documents and perform semantic search using vector embeddings.',
            metadata: {
              title: 'RAG Features Guide',
              author: 'Engineering Team',
              score: 0.88
            }
          },
          {
            content: 'You can query across all four database types using a single unified API endpoint.',
            metadata: {
              title: 'API Reference',
              author: 'Documentation Team',
              score: 0.82
            }
          }
        ].slice(0, limit),
        executionTime: Math.floor(Math.random() * 500) + 200
      };

      this._panel.webview.postMessage({
        command: 'queryResult',
        result: mockResults
      });
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: 'queryError',
        error: error.message
      });
    }
  }

  private _generateMockAnswer(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('what') || lowerQuery.includes('explain')) {
      return 'Based on the indexed documents, SymbioseDB is a unified multi-database platform that combines PostgreSQL, Vector Search (pgvector), Graph Database (Apache AGE), and Blockchain (Ethereum L2) into a single, developer-friendly API. It features intelligent query routing, RAG capabilities, and production-grade performance optimization.';
    } else if (lowerQuery.includes('how')) {
      return 'To use SymbioseDB, you can connect to the API using the provided SDK, execute queries across any of the four database types, and leverage features like semantic search, graph traversal, and blockchain attestations. The RAG system allows you to index documents and perform intelligent question-answering.';
    } else if (lowerQuery.includes('why')) {
      return 'SymbioseDB simplifies multi-database architectures by providing a unified interface. Instead of managing separate connections and APIs for PostgreSQL, vector databases, graph databases, and blockchain, you can access all capabilities through one consistent API.';
    } else {
      return 'SymbioseDB provides a unified platform for all your database needs. The system has found relevant information from the indexed documents that matches your query. Please review the source citations below for more detailed information.';
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'RAG Query';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RAG Query</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
    }

    .header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .header h1 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
    }

    .header p {
      margin: 0;
      color: var(--vscode-descriptionForeground);
      font-size: 13px;
    }

    .query-input {
      margin-bottom: 20px;
    }

    .query-input textarea {
      width: 100%;
      min-height: 80px;
      padding: 12px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      font-family: var(--vscode-font-family);
      font-size: 14px;
      resize: vertical;
    }

    .query-options {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
    }

    .query-options label {
      font-size: 13px;
      font-weight: 500;
    }

    .query-options input {
      width: 80px;
      padding: 6px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      font-size: 13px;
    }

    button {
      padding: 8px 16px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }

    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .results {
      margin-top: 24px;
      display: none;
    }

    .answer-box {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .answer-box h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--vscode-symbolIcon-classForeground);
    }

    .answer-text {
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }

    .execution-time {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 12px;
    }

    .sources {
      margin-top: 24px;
    }

    .sources h3 {
      margin: 0 0 16px 0;
      font-size: 15px;
      font-weight: 600;
    }

    .source-item {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-left: 3px solid var(--vscode-symbolIcon-methodForeground);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .source-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .source-title {
      font-weight: 600;
      font-size: 13px;
    }

    .source-score {
      font-size: 12px;
      padding: 2px 8px;
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 10px;
    }

    .source-meta {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }

    .source-content {
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
      padding: 8px;
      background-color: var(--vscode-textCodeBlock-background);
      border-radius: 3px;
    }

    .error {
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      color: var(--vscode-errorForeground);
      padding: 12px;
      border-radius: 4px;
      margin-top: 16px;
    }

    .no-results {
      text-align: center;
      padding: 40px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 RAG Query</h1>
    <p>Ask questions and get answers from indexed documents using semantic search</p>
  </div>

  <div class="query-input">
    <textarea id="queryInput" placeholder="Ask a question about your indexed documents...

Examples:
• What is SymbioseDB?
• How do I use the RAG system?
• Explain vector search capabilities"></textarea>
  </div>

  <div class="query-options">
    <label>Max Results:</label>
    <input type="number" id="limitInput" value="5" min="1" max="20" />
    <button id="executeBtn">🚀 Search</button>
  </div>

  <div id="results" class="results"></div>

  <script>
    const vscode = acquireVsCodeApi();

    const queryInput = document.getElementById('queryInput');
    const limitInput = document.getElementById('limitInput');
    const executeBtn = document.getElementById('executeBtn');
    const results = document.getElementById('results');

    executeBtn.addEventListener('click', executeQuery);

    queryInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        executeQuery();
      }
    });

    function executeQuery() {
      const query = queryInput.value.trim();
      const limit = parseInt(limitInput.value);

      if (!query) {
        showError('Please enter a question');
        return;
      }

      executeBtn.disabled = true;
      executeBtn.textContent = '⏳ Searching...';
      results.innerHTML = '';
      results.style.display = 'none';

      vscode.postMessage({
        command: 'executeQuery',
        query: query,
        limit: limit
      });
    }

    window.addEventListener('message', event => {
      const message = event.data;

      executeBtn.disabled = false;
      executeBtn.textContent = '🚀 Search';

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

      let html = '';

      // Answer box
      html += \`
        <div class="answer-box">
          <h3>💡 Answer</h3>
          <p class="answer-text">\${escapeHtml(result.answer)}</p>
          <div class="execution-time">⏱ Executed in \${result.executionTime}ms</div>
        </div>
      \`;

      // Sources
      if (result.sources && result.sources.length > 0) {
        html += '<div class="sources"><h3>📚 Sources (\${result.sources.length})</h3>';

        result.sources.forEach((source, index) => {
          const score = (source.metadata.score * 100).toFixed(0);
          html += \`
            <div class="source-item">
              <div class="source-header">
                <span class="source-title">\${escapeHtml(source.metadata.title)}</span>
                <span class="source-score">\${score}% match</span>
              </div>
              <div class="source-meta">👤 \${escapeHtml(source.metadata.author)}</div>
              <p class="source-content">\${escapeHtml(source.content)}</p>
            </div>
          \`;
        });

        html += '</div>';
      } else {
        html += '<div class="no-results">📭 No sources found</div>';
      }

      results.innerHTML = html;
    }

    function showError(error) {
      results.style.display = 'block';
      results.innerHTML = \`<div class="error">❌ Error: \${escapeHtml(error)}</div>\`;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
  }
}
