/**
 * API Testing Panel
 * Test SymbioseDB API endpoints manually
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class APITestingPanel {
  public static currentPanel: APITestingPanel | undefined;
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
          case 'testEndpoint':
            this._testEndpoint(message.endpoint, message.method, message.body);
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

    if (APITestingPanel.currentPanel) {
      APITestingPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbAPITesting',
      'API Testing',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    APITestingPanel.currentPanel = new APITestingPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    APITestingPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _testEndpoint(endpoint: string, method: string, body: string) {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-response-time': '45ms'
        },
        data: this._generateMockResponse(endpoint, method, body),
        executionTime: Math.floor(Math.random() * 100) + 20
      };

      this._panel.webview.postMessage({
        command: 'testResult',
        result: mockResponse
      });
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: 'testError',
        error: error.message
      });
    }
  }

  private _generateMockResponse(endpoint: string, method: string, body: string): any {
    if (endpoint === '/health') {
      return {
        status: 'healthy',
        uptime: 123456,
        timestamp: new Date().toISOString(),
        databases: {
          sql: { connected: true, latency: 12 },
          vector: { connected: true, latency: 18 },
          graph: { connected: true, latency: 15 },
          blockchain: { connected: true, latency: 45 }
        }
      };
    } else if (endpoint === '/query' && method === 'POST') {
      return {
        success: true,
        data: {
          rows: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' }
          ],
          rowCount: 2
        },
        executionTime: 23
      };
    } else if (endpoint === '/vector/search' && method === 'POST') {
      return {
        success: true,
        results: [
          {
            id: 'vec-1',
            similarity: 0.95,
            metadata: { title: 'Document 1' }
          },
          {
            id: 'vec-2',
            similarity: 0.87,
            metadata: { title: 'Document 2' }
          }
        ]
      };
    } else {
      return {
        success: true,
        message: 'Mock response for endpoint: ' + endpoint
      };
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'API Testing';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Testing</title>
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

    .endpoint-selector {
      margin-bottom: 24px;
    }

    .endpoint-item {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .endpoint-item:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .endpoint-item.selected {
      border-color: var(--vscode-focusBorder);
      background-color: var(--vscode-list-activeSelectionBackground);
    }

    .endpoint-method {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 8px;
    }

    .endpoint-method.GET {
      background-color: #00a82d;
      color: white;
    }

    .endpoint-method.POST {
      background-color: #0078d4;
      color: white;
    }

    .endpoint-method.PUT {
      background-color: #ea580c;
      color: white;
    }

    .endpoint-method.DELETE {
      background-color: #d13438;
      color: white;
    }

    .endpoint-path {
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }

    .endpoint-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    .request-body {
      margin-bottom: 24px;
    }

    .request-body label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 13px;
    }

    .request-body textarea {
      width: 100%;
      min-height: 200px;
      padding: 10px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      resize: vertical;
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

    .response-section {
      margin-top: 32px;
      display: none;
    }

    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .response-header h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }

    .response-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge.success {
      background-color: var(--vscode-testing-iconPassed);
      color: var(--vscode-editor-background);
    }

    .status-badge.error {
      background-color: var(--vscode-testing-iconFailed);
      color: white;
    }

    .execution-time {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .response-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .response-tab {
      padding: 8px 16px;
      cursor: pointer;
      font-size: 13px;
      border-bottom: 2px solid transparent;
      transition: border-color 0.2s;
    }

    .response-tab.active {
      border-bottom-color: var(--vscode-focusBorder);
      font-weight: 600;
    }

    .response-content {
      background-color: var(--vscode-textCodeBlock-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 12px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .help-text {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧪 API Testing</h1>
    <p>Test SymbioseDB API endpoints and view responses</p>
  </div>

  <div class="endpoint-selector">
    <h3 style="font-size: 14px; margin-bottom: 12px;">Select Endpoint</h3>

    <div class="endpoint-item" data-endpoint="/health" data-method="GET" data-body="">
      <div>
        <span class="endpoint-method GET">GET</span>
        <span class="endpoint-path">/health</span>
      </div>
      <div class="endpoint-description">Check system health and database connections</div>
    </div>

    <div class="endpoint-item" data-endpoint="/query" data-method="POST" data-body='{\n  "type": "sql",\n  "query": "SELECT * FROM users LIMIT 5"\n}'>
      <div>
        <span class="endpoint-method POST">POST</span>
        <span class="endpoint-path">/query</span>
      </div>
      <div class="endpoint-description">Execute unified query across databases</div>
    </div>

    <div class="endpoint-item" data-endpoint="/vector/search" data-method="POST" data-body='{\n  "embedding": [0.1, 0.2, 0.3, 0.4],\n  "limit": 10,\n  "threshold": 0.8\n}'>
      <div>
        <span class="endpoint-method POST">POST</span>
        <span class="endpoint-path">/vector/search</span>
      </div>
      <div class="endpoint-description">Perform vector similarity search</div>
    </div>

    <div class="endpoint-item" data-endpoint="/attestation/store" data-method="POST" data-body='{\n  "action": "USER_CREATED",\n  "data": {\n    "userId": "123",\n    "timestamp": "2025-01-01T00:00:00Z"\n  }\n}'>
      <div>
        <span class="endpoint-method POST">POST</span>
        <span class="endpoint-path">/attestation/store</span>
      </div>
      <div class="endpoint-description">Create blockchain attestation</div>
    </div>

    <div class="endpoint-item" data-endpoint="/rag/index" data-method="POST" data-body='{\n  "content": "Document content here",\n  "metadata": {\n    "title": "My Document",\n    "author": "Alice"\n  }\n}'>
      <div>
        <span class="endpoint-method POST">POST</span>
        <span class="endpoint-path">/rag/index</span>
      </div>
      <div class="endpoint-description">Index document for RAG</div>
    </div>

    <div class="endpoint-item" data-endpoint="/rag/query" data-method="POST" data-body='{\n  "query": "What is SymbioseDB?",\n  "limit": 5\n}'>
      <div>
        <span class="endpoint-method POST">POST</span>
        <span class="endpoint-path">/rag/query</span>
      </div>
      <div class="endpoint-description">Query RAG system</div>
    </div>
  </div>

  <div class="request-body" id="requestBodySection" style="display: none;">
    <label>Request Body (JSON)</label>
    <textarea id="requestBody" placeholder="Enter JSON request body..."></textarea>
    <div class="help-text">Edit the JSON body before sending the request</div>
  </div>

  <button id="testBtn" disabled>🚀 Send Request</button>

  <div id="responseSection" class="response-section">
    <div class="response-header">
      <h2>Response</h2>
      <div class="response-status">
        <span id="statusBadge" class="status-badge"></span>
        <span id="executionTime" class="execution-time"></span>
      </div>
    </div>

    <div class="response-tabs">
      <div class="response-tab active" data-tab="body">Body</div>
      <div class="response-tab" data-tab="headers">Headers</div>
    </div>

    <div id="responseBody" class="response-content"></div>
    <div id="responseHeaders" class="response-content" style="display: none;"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    let selectedEndpoint = null;
    let selectedMethod = null;

    const endpointItems = document.querySelectorAll('.endpoint-item');
    const requestBodySection = document.getElementById('requestBodySection');
    const requestBody = document.getElementById('requestBody');
    const testBtn = document.getElementById('testBtn');
    const responseSection = document.getElementById('responseSection');
    const statusBadge = document.getElementById('statusBadge');
    const executionTime = document.getElementById('executionTime');
    const responseBody = document.getElementById('responseBody');
    const responseHeaders = document.getElementById('responseHeaders');
    const responseTabs = document.querySelectorAll('.response-tab');

    endpointItems.forEach(item => {
      item.addEventListener('click', () => {
        endpointItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        selectedEndpoint = item.dataset.endpoint;
        selectedMethod = item.dataset.method;

        if (selectedMethod === 'POST' || selectedMethod === 'PUT') {
          requestBodySection.style.display = 'block';
          requestBody.value = item.dataset.body;
        } else {
          requestBodySection.style.display = 'none';
          requestBody.value = '';
        }

        testBtn.disabled = false;
      });
    });

    testBtn.addEventListener('click', () => {
      if (!selectedEndpoint) return;

      testBtn.disabled = true;
      testBtn.textContent = '⏳ Sending...';

      const body = (selectedMethod === 'POST' || selectedMethod === 'PUT')
        ? requestBody.value.trim()
        : '';

      vscode.postMessage({
        command: 'testEndpoint',
        endpoint: selectedEndpoint,
        method: selectedMethod,
        body: body
      });
    });

    responseTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        responseTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabName = tab.dataset.tab;
        if (tabName === 'body') {
          responseBody.style.display = 'block';
          responseHeaders.style.display = 'none';
        } else if (tabName === 'headers') {
          responseBody.style.display = 'none';
          responseHeaders.style.display = 'block';
        }
      });
    });

    window.addEventListener('message', event => {
      const message = event.data;

      testBtn.disabled = false;
      testBtn.textContent = '🚀 Send Request';

      switch (message.command) {
        case 'testResult':
          showResponse(message.result);
          break;
        case 'testError':
          showError(message.error);
          break;
      }
    });

    function showResponse(result) {
      responseSection.style.display = 'block';

      // Status badge
      if (result.status >= 200 && result.status < 300) {
        statusBadge.className = 'status-badge success';
        statusBadge.textContent = \`\${result.status} \${result.statusText}\`;
      } else {
        statusBadge.className = 'status-badge error';
        statusBadge.textContent = \`\${result.status} \${result.statusText}\`;
      }

      // Execution time
      executionTime.textContent = \`⏱ \${result.executionTime}ms\`;

      // Response body
      responseBody.textContent = JSON.stringify(result.data, null, 2);

      // Response headers
      let headersText = '';
      for (const [key, value] of Object.entries(result.headers)) {
        headersText += \`\${key}: \${value}\n\`;
      }
      responseHeaders.textContent = headersText;
    }

    function showError(error) {
      responseSection.style.display = 'block';
      statusBadge.className = 'status-badge error';
      statusBadge.textContent = 'Error';
      executionTime.textContent = '';
      responseBody.textContent = \`Error: \${error}\`;
    }
  </script>
</body>
</html>`;
  }
}
