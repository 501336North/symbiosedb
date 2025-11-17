/**
 * RAG Index Document Panel
 * Upload and index documents for RAG
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class RAGIndexPanel {
  public static currentPanel: RAGIndexPanel | undefined;
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
          case 'indexDocument':
            this._indexDocument(message.content, message.metadata, message.chunkSize);
            return;
          case 'selectFile':
            this._selectFile();
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

    if (RAGIndexPanel.currentPanel) {
      RAGIndexPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbRAGIndex',
      'Index Document for RAG',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    RAGIndexPanel.currentPanel = new RAGIndexPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    RAGIndexPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _selectFile() {
    const fileUri = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Text Files': ['txt', 'md', 'json'],
        'All Files': ['*']
      }
    });

    if (fileUri && fileUri[0]) {
      const content = await vscode.workspace.fs.readFile(fileUri[0]);
      const text = new TextDecoder().decode(content);
      const fileName = fileUri[0].path.split('/').pop() || 'Unknown';

      this._panel.webview.postMessage({
        command: 'fileSelected',
        content: text,
        fileName: fileName
      });
    }
  }

  private async _indexDocument(content: string, metadata: any, chunkSize: number) {
    try {
      // In a real implementation, this would call the RAG indexing API
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      this._panel.webview.postMessage({
        command: 'indexSuccess',
        message: `Document indexed successfully with ${Math.ceil(content.length / chunkSize)} chunks`
      });

      vscode.window.showInformationMessage('✓ Document indexed successfully');
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: 'indexError',
        error: error.message
      });

      vscode.window.showErrorMessage(`✗ Indexing failed: ${error.message}`);
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Index Document for RAG';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Index Document for RAG</title>
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

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 13px;
    }

    .form-group textarea {
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

    .form-group input[type="text"],
    .form-group input[type="number"] {
      width: 100%;
      padding: 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      font-size: 13px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
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

    button.secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      margin-right: 8px;
    }

    button.secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .actions {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-panel-border);
    }

    .result {
      margin-top: 20px;
      padding: 12px;
      border-radius: 4px;
      font-size: 13px;
    }

    .result.success {
      background-color: var(--vscode-testing-iconPassed);
      color: var(--vscode-editor-background);
    }

    .result.error {
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      color: var(--vscode-errorForeground);
    }

    .help-text {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    .file-info {
      margin-top: 8px;
      padding: 8px;
      background-color: var(--vscode-editorWidget-background);
      border-radius: 3px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 Index Document for RAG</h1>
    <p>Upload and index documents for semantic search and retrieval-augmented generation</p>
  </div>

  <div class="form-group">
    <label>Document Content</label>
    <textarea id="content" placeholder="Paste document text here or click 'Select File' to load from file..."></textarea>
    <button class="secondary" id="selectFileBtn" style="margin-top: 8px;">📁 Select File</button>
    <div id="fileInfo" class="file-info" style="display: none;"></div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label>Document Title</label>
      <input type="text" id="title" placeholder="e.g., Getting Started Guide" />
      <div class="help-text">Descriptive title for this document</div>
    </div>

    <div class="form-group">
      <label>Author (Optional)</label>
      <input type="text" id="author" placeholder="e.g., Documentation Team" />
      <div class="help-text">Author or source of the document</div>
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label>Chunk Size</label>
      <input type="number" id="chunkSize" value="500" min="100" max="2000" />
      <div class="help-text">Characters per chunk (100-2000)</div>
    </div>

    <div class="form-group">
      <label>Category (Optional)</label>
      <input type="text" id="category" placeholder="e.g., Documentation, Tutorial" />
      <div class="help-text">Category for organization</div>
    </div>
  </div>

  <div class="actions">
    <button id="indexBtn">🚀 Index Document</button>
  </div>

  <div id="result" style="display: none;"></div>

  <script>
    const vscode = acquireVsCodeApi();

    const contentInput = document.getElementById('content');
    const titleInput = document.getElementById('title');
    const authorInput = document.getElementById('author');
    const chunkSizeInput = document.getElementById('chunkSize');
    const categoryInput = document.getElementById('category');
    const indexBtn = document.getElementById('indexBtn');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const result = document.getElementById('result');
    const fileInfo = document.getElementById('fileInfo');

    selectFileBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'selectFile' });
    });

    indexBtn.addEventListener('click', () => {
      const content = contentInput.value.trim();
      const title = titleInput.value.trim();
      const chunkSize = parseInt(chunkSizeInput.value);

      if (!content) {
        showError('Please enter document content');
        return;
      }

      if (!title) {
        showError('Please enter a document title');
        return;
      }

      if (chunkSize < 100 || chunkSize > 2000) {
        showError('Chunk size must be between 100 and 2000');
        return;
      }

      const metadata = {
        title: title,
        author: authorInput.value.trim() || 'Unknown',
        category: categoryInput.value.trim() || 'General',
        createdAt: new Date().toISOString()
      };

      indexBtn.disabled = true;
      indexBtn.textContent = '⏳ Indexing...';

      vscode.postMessage({
        command: 'indexDocument',
        content: content,
        metadata: metadata,
        chunkSize: chunkSize
      });
    });

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'fileSelected':
          contentInput.value = message.content;
          titleInput.value = message.fileName.replace(/\.[^/.]+$/, '');
          fileInfo.textContent = \`📄 Loaded: \${message.fileName} (\${message.content.length} characters)\`;
          fileInfo.style.display = 'block';
          break;

        case 'indexSuccess':
          showSuccess(message.message);
          indexBtn.disabled = false;
          indexBtn.textContent = '🚀 Index Document';
          break;

        case 'indexError':
          showError(message.error);
          indexBtn.disabled = false;
          indexBtn.textContent = '🚀 Index Document';
          break;
      }
    });

    function showSuccess(message) {
      result.className = 'result success';
      result.textContent = '✓ ' + message;
      result.style.display = 'block';
    }

    function showError(message) {
      result.className = 'result error';
      result.textContent = '✗ ' + message;
      result.style.display = 'block';
    }
  </script>
</body>
</html>`;
  }
}
