/**
 * Blockchain Query Panel
 * Webview panel for querying blockchain attestations
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class BlockchainQueryPanel {
  public static currentPanel: BlockchainQueryPanel | undefined;
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
          case 'queryAttestations':
            this._queryAttestations(message.limit);
            return;
          case 'verifyAttestation':
            this._verifyAttestation(message.attestationId);
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

    if (BlockchainQueryPanel.currentPanel) {
      BlockchainQueryPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbBlockchainQuery',
      'Blockchain Query',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    BlockchainQueryPanel.currentPanel = new BlockchainQueryPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    BlockchainQueryPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _queryAttestations(limit: number) {
    try {
      const result = await this.queryExecutor.executeBlockchainQuery({
        type: 'attestations',
        limit: limit
      });

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

  private async _verifyAttestation(attestationId: string) {
    try {
      const result = await this.queryExecutor.executeBlockchainQuery({
        type: 'verify',
        attestationId: attestationId
      });

      this._panel.webview.postMessage({
        command: 'verifyResult',
        result: result
      });
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: 'verifyError',
        error: error.message
      });
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Blockchain Query';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blockchain Query</title>
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

    .section {
      margin-bottom: 30px;
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 20px;
    }

    h2 {
      margin-top: 0;
      color: var(--vscode-foreground);
      font-size: 18px;
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

    input {
      width: 100%;
      padding: 8px;
      font-size: 14px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      box-sizing: border-box;
    }

    input[type="number"] {
      width: 150px;
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

    .attestation-card {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
    }

    .attestation-card:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .attestation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .attestation-id {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      color: var(--vscode-button-background);
    }

    .attestation-action {
      display: inline-block;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .attestation-timestamp {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      margin-top: 8px;
    }

    .verify-result {
      background-color: var(--vscode-editorWidget-background);
      border: 2px solid var(--vscode-testing-iconPassed);
      border-radius: 6px;
      padding: 15px;
      margin-top: 15px;
    }

    .verify-result.failed {
      border-color: var(--vscode-testing-iconFailed);
    }

    .verify-status {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .verify-status.verified {
      color: var(--vscode-testing-iconPassed);
    }

    .verify-status.failed {
      color: var(--vscode-testing-iconFailed);
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
    <h1>⛓️ Blockchain Attestation Query</h1>

    <div class="section">
      <h2>Query Attestations</h2>
      <div class="form-group">
        <label for="limitInput">Result Limit</label>
        <input type="number" id="limitInput" value="10" min="1" max="100" />
        <div class="help-text">Maximum number of attestations to return (1-100)</div>
      </div>
      <button id="queryBtn">🔍 Query Attestations</button>
    </div>

    <div class="section">
      <h2>Verify Attestation</h2>
      <div class="form-group">
        <label for="attestationIdInput">Attestation ID</label>
        <input type="text" id="attestationIdInput" placeholder="Enter attestation ID..." />
        <div class="help-text">Enter the attestation ID to verify on blockchain</div>
      </div>
      <button id="verifyBtn">✓ Verify</button>
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
    const limitInput = document.getElementById('limitInput');
    const attestationIdInput = document.getElementById('attestationIdInput');
    const queryBtn = document.getElementById('queryBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const results = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const executionTime = document.getElementById('executionTime');

    queryBtn.addEventListener('click', () => {
      const limit = parseInt(limitInput.value);

      queryBtn.disabled = true;
      queryBtn.textContent = '⏳ Querying...';

      vscode.postMessage({
        command: 'queryAttestations',
        limit: limit
      });
    });

    verifyBtn.addEventListener('click', () => {
      const attestationId = attestationIdInput.value.trim();

      if (!attestationId) {
        showError('Please enter an attestation ID');
        return;
      }

      verifyBtn.disabled = true;
      verifyBtn.textContent = '⏳ Verifying...';

      vscode.postMessage({
        command: 'verifyAttestation',
        attestationId: attestationId
      });
    });

    window.addEventListener('message', event => {
      const message = event.data;

      queryBtn.disabled = false;
      queryBtn.textContent = '🔍 Query Attestations';
      verifyBtn.disabled = false;
      verifyBtn.textContent = '✓ Verify';

      switch (message.command) {
        case 'queryResult':
          showAttestations(message.result);
          break;
        case 'verifyResult':
          showVerification(message.result);
          break;
        case 'queryError':
        case 'verifyError':
          showError(message.error);
          break;
      }
    });

    function showAttestations(result) {
      results.style.display = 'block';
      executionTime.textContent = \`Executed in \${result.executionTime}ms\`;

      if (!result.success) {
        showError(result.error);
        return;
      }

      if (result.data && result.data.attestations && result.data.attestations.length > 0) {
        let html = '';
        result.data.attestations.forEach(attestation => {
          const date = new Date(attestation.timestamp).toLocaleString();
          html += \`
            <div class="attestation-card">
              <div class="attestation-header">
                <span class="attestation-id">\${attestation.id}</span>
                <span class="attestation-action">\${attestation.action}</span>
              </div>
              <div class="attestation-timestamp">📅 \${date}</div>
            </div>
          \`;
        });
        resultsContent.innerHTML = html;
      } else {
        resultsContent.innerHTML = '<div class="no-results">No attestations found.</div>';
      }
    }

    function showVerification(result) {
      results.style.display = 'block';
      executionTime.textContent = \`Executed in \${result.executionTime}ms\`;

      if (!result.success) {
        showError(result.error);
        return;
      }

      if (result.data) {
        const verified = result.data.verified;
        const statusClass = verified ? 'verified' : 'failed';
        const resultClass = verified ? '' : 'failed';
        const statusText = verified ? '✓ VERIFIED' : '✗ NOT VERIFIED';
        const date = new Date(result.data.timestamp).toLocaleString();

        const html = \`
          <div class="verify-result \${resultClass}">
            <div class="verify-status \${statusClass}">\${statusText}</div>
            <div><strong>Attestation ID:</strong> \${result.data.attestationId}</div>
            <div><strong>Timestamp:</strong> \${date}</div>
          </div>
        \`;
        resultsContent.innerHTML = html;
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
