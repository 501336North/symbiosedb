/**
 * Monitoring Dashboard Panel
 * View system metrics, query performance, and connection status
 */

import * as vscode from 'vscode';
import { QueryExecutor } from '../utils/queryExecutor';

export class MonitoringPanel {
  public static currentPanel: MonitoringPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _refreshInterval: NodeJS.Timeout | undefined;

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
            this._sendMetrics();
            return;
          case 'startAutoRefresh':
            this._startAutoRefresh();
            return;
          case 'stopAutoRefresh':
            this._stopAutoRefresh();
            return;
        }
      },
      null,
      this._disposables
    );

    // Send initial metrics
    this._sendMetrics();
  }

  public static createOrShow(extensionUri: vscode.Uri, queryExecutor: QueryExecutor) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (MonitoringPanel.currentPanel) {
      MonitoringPanel.currentPanel._panel.reveal(column);
      MonitoringPanel.currentPanel._sendMetrics();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'symbiosedbMonitoring',
      'SymbioseDB Monitoring',
      column || vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    MonitoringPanel.currentPanel = new MonitoringPanel(panel, extensionUri, queryExecutor);
  }

  public dispose() {
    MonitoringPanel.currentPanel = undefined;

    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _startAutoRefresh() {
    if (this._refreshInterval) {
      return;
    }

    this._refreshInterval = setInterval(() => {
      this._sendMetrics();
    }, 5000); // Refresh every 5 seconds
  }

  private _stopAutoRefresh() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = undefined;
    }
  }

  private _sendMetrics() {
    const history = this.queryExecutor.getQueryHistory();

    // Calculate metrics from query history
    const totalQueries = history.length;
    const successfulQueries = history.filter(q => q.success).length;
    const failedQueries = history.filter(q => !q.success).length;
    const successRate = totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 0;

    const avgExecutionTime = totalQueries > 0
      ? history.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries
      : 0;

    const queriesByType = {
      sql: history.filter(q => q.type === 'sql').length,
      cypher: history.filter(q => q.type === 'cypher').length,
      vector: history.filter(q => q.type === 'vector').length,
      blockchain: history.filter(q => q.type === 'blockchain').length
    };

    // Mock connection status (in real app, this would come from ConnectionManager)
    const connectionStatus = {
      sql: { connected: true, latency: Math.floor(Math.random() * 20) + 5 },
      vector: { connected: true, latency: Math.floor(Math.random() * 30) + 10 },
      graph: { connected: true, latency: Math.floor(Math.random() * 25) + 8 },
      blockchain: { connected: true, latency: Math.floor(Math.random() * 50) + 20 }
    };

    // Recent queries (last 10)
    const recentQueries = history.slice(-10).reverse();

    const metrics = {
      overview: {
        totalQueries,
        successfulQueries,
        failedQueries,
        successRate: successRate.toFixed(1),
        avgExecutionTime: avgExecutionTime.toFixed(1)
      },
      queriesByType,
      connectionStatus,
      recentQueries,
      timestamp: new Date().toISOString()
    };

    this._panel.webview.postMessage({
      command: 'metricsData',
      metrics: metrics
    });
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'SymbioseDB Monitoring';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SymbioseDB Monitoring</title>
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
      align-items: center;
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

    .auto-refresh-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    input[type="checkbox"] {
      cursor: pointer;
    }

    .content {
      padding: 20px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 16px;
    }

    .metric-label {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .metric-unit {
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
    }

    .metric-card.success .metric-value {
      color: var(--vscode-testing-iconPassed);
    }

    .metric-card.error .metric-value {
      color: var(--vscode-testing-iconFailed);
    }

    .section {
      margin-bottom: 32px;
    }

    .section h2 {
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    .connection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .connection-card {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-left: 3px solid var(--vscode-testing-iconPassed);
      border-radius: 4px;
      padding: 12px;
    }

    .connection-card.disconnected {
      border-left-color: var(--vscode-testing-iconFailed);
    }

    .connection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .connection-name {
      font-weight: 600;
      font-size: 13px;
    }

    .connection-status {
      font-size: 20px;
    }

    .connection-latency {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .query-distribution {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .query-bar {
      margin-bottom: 12px;
    }

    .query-bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .query-bar-track {
      height: 8px;
      background-color: var(--vscode-input-background);
      border-radius: 4px;
      overflow: hidden;
    }

    .query-bar-fill {
      height: 100%;
      background-color: var(--vscode-symbolIcon-methodForeground);
      transition: width 0.3s ease;
    }

    .recent-queries {
      background-color: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 16px;
    }

    .recent-query-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      margin-bottom: 6px;
      background-color: var(--vscode-textCodeBlock-background);
      border-radius: 3px;
      font-size: 12px;
    }

    .recent-query-item.success {
      border-left: 2px solid var(--vscode-testing-iconPassed);
    }

    .recent-query-item.error {
      border-left: 2px solid var(--vscode-testing-iconFailed);
    }

    .query-type {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      margin-right: 8px;
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

    .last-updated {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      text-align: right;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 SymbioseDB Monitoring</h1>
    <div class="toolbar">
      <div class="auto-refresh-toggle">
        <input type="checkbox" id="autoRefreshCheckbox" />
        <label for="autoRefreshCheckbox">Auto-refresh (5s)</label>
      </div>
      <button id="refreshBtn" class="secondary">🔄 Refresh</button>
    </div>
  </div>

  <div class="content">
    <div id="metricsContainer">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Queries</div>
          <div class="metric-value" id="totalQueries">0</div>
        </div>
        <div class="metric-card success">
          <div class="metric-label">Successful</div>
          <div class="metric-value" id="successfulQueries">0</div>
        </div>
        <div class="metric-card error">
          <div class="metric-label">Failed</div>
          <div class="metric-value" id="failedQueries">0</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Success Rate</div>
          <div class="metric-value" id="successRate">0<span class="metric-unit">%</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg Execution Time</div>
          <div class="metric-value" id="avgExecutionTime">0<span class="metric-unit">ms</span></div>
        </div>
      </div>

      <div class="section">
        <h2>🌐 Connection Status</h2>
        <div class="connection-grid" id="connectionGrid"></div>
      </div>

      <div class="section">
        <h2>📈 Query Distribution</h2>
        <div class="query-distribution" id="queryDistribution"></div>
      </div>

      <div class="section">
        <h2>⚡ Recent Queries</h2>
        <div class="recent-queries" id="recentQueries">
          <div style="text-align: center; color: var(--vscode-descriptionForeground); padding: 20px;">
            No queries executed yet
          </div>
        </div>
      </div>

      <div class="last-updated" id="lastUpdated"></div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const refreshBtn = document.getElementById('refreshBtn');
    const autoRefreshCheckbox = document.getElementById('autoRefreshCheckbox');

    refreshBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'refresh' });
    });

    autoRefreshCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        vscode.postMessage({ command: 'startAutoRefresh' });
      } else {
        vscode.postMessage({ command: 'stopAutoRefresh' });
      }
    });

    window.addEventListener('message', event => {
      const message = event.data;

      if (message.command === 'metricsData') {
        updateMetrics(message.metrics);
      }
    });

    function updateMetrics(metrics) {
      // Update overview metrics
      document.getElementById('totalQueries').textContent = metrics.overview.totalQueries;
      document.getElementById('successfulQueries').textContent = metrics.overview.successfulQueries;
      document.getElementById('failedQueries').textContent = metrics.overview.failedQueries;
      document.getElementById('successRate').innerHTML = \`\${metrics.overview.successRate}<span class="metric-unit">%</span>\`;
      document.getElementById('avgExecutionTime').innerHTML = \`\${metrics.overview.avgExecutionTime}<span class="metric-unit">ms</span>\`;

      // Update connection status
      const connectionGrid = document.getElementById('connectionGrid');
      connectionGrid.innerHTML = '';

      const databases = [
        { key: 'sql', name: 'PostgreSQL', icon: '🗄️' },
        { key: 'vector', name: 'Vector Search', icon: '🔍' },
        { key: 'graph', name: 'Graph Database', icon: '🕸️' },
        { key: 'blockchain', name: 'Blockchain', icon: '⛓️' }
      ];

      databases.forEach(db => {
        const status = metrics.connectionStatus[db.key];
        const card = document.createElement('div');
        card.className = 'connection-card' + (status.connected ? '' : ' disconnected');
        card.innerHTML = \`
          <div class="connection-header">
            <span class="connection-name">\${db.icon} \${db.name}</span>
            <span class="connection-status">\${status.connected ? '🟢' : '🔴'}</span>
          </div>
          <div class="connection-latency">Latency: \${status.latency}ms</div>
        \`;
        connectionGrid.appendChild(card);
      });

      // Update query distribution
      const queryDistribution = document.getElementById('queryDistribution');
      const totalQueriesByType = Object.values(metrics.queriesByType).reduce((sum, count) => sum + count, 0);

      let distributionHtml = '';
      const queryTypes = [
        { key: 'sql', name: 'SQL', color: '#0078d4' },
        { key: 'cypher', name: 'Cypher', color: '#00a82d' },
        { key: 'vector', name: 'Vector', color: '#8b5cf6' },
        { key: 'blockchain', name: 'Blockchain', color: '#ea580c' }
      ];

      queryTypes.forEach(type => {
        const count = metrics.queriesByType[type.key];
        const percentage = totalQueriesByType > 0 ? (count / totalQueriesByType) * 100 : 0;

        distributionHtml += \`
          <div class="query-bar">
            <div class="query-bar-label">
              <span>\${type.name}</span>
              <span>\${count} queries (\${percentage.toFixed(1)}%)</span>
            </div>
            <div class="query-bar-track">
              <div class="query-bar-fill" style="width: \${percentage}%; background-color: \${type.color};"></div>
            </div>
          </div>
        \`;
      });

      queryDistribution.innerHTML = distributionHtml;

      // Update recent queries
      const recentQueries = document.getElementById('recentQueries');
      if (metrics.recentQueries.length === 0) {
        recentQueries.innerHTML = '<div style="text-align: center; color: var(--vscode-descriptionForeground); padding: 20px;">No queries executed yet</div>';
      } else {
        let queriesHtml = '';
        metrics.recentQueries.forEach(query => {
          const statusClass = query.success ? 'success' : 'error';
          const timestamp = new Date(query.timestamp).toLocaleTimeString();
          queriesHtml += \`
            <div class="recent-query-item \${statusClass}">
              <div>
                <span class="query-type \${query.type}">\${query.type}</span>
                <span>\${escapeHtml(query.query.substring(0, 60))}\${query.query.length > 60 ? '...' : ''}</span>
              </div>
              <div>\${query.executionTime}ms • \${timestamp}</div>
            </div>
          \`;
        });
        recentQueries.innerHTML = queriesHtml;
      }

      // Update last updated timestamp
      const lastUpdated = document.getElementById('lastUpdated');
      lastUpdated.textContent = \`Last updated: \${new Date(metrics.timestamp).toLocaleTimeString()}\`;
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
