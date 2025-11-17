/**
 * Connection Manager
 * Manages database connections for SymbioseDB
 */

import * as vscode from 'vscode';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionConfig {
  apiUrl: string;
  apiKey?: string;
  database?: {
    host?: string;
    port?: number;
    name?: string;
    user?: string;
    password?: string;
  };
}

export interface ConnectionResult {
  success: boolean;
  error?: string;
  responseTime?: number;
}

export interface ConnectionStatusInfo {
  status: ConnectionStatus;
  apiUrl: string | null;
  error?: string;
  connectedAt?: Date;
}

type ConnectionChangedCallback = (status: ConnectionStatus) => void;

export class ConnectionManager {
  private status: ConnectionStatus = 'disconnected';
  private config: ConnectionConfig | null = null;
  private client: any = null;
  private listeners: ConnectionChangedCallback[] = [];
  private connectedAt: Date | null = null;
  private lastError: string | null = null;

  /**
   * Connect to SymbioseDB
   */
  async connect(config: ConnectionConfig): Promise<ConnectionResult> {
    this.status = 'connecting';
    this.emitConnectionChanged('connecting');

    try {
      // Test the connection first
      const startTime = Date.now();
      const testResult = await this.testConnection(config);

      if (!testResult.success) {
        this.status = 'error';
        this.lastError = testResult.error || 'Connection failed';
        this.emitConnectionChanged('error');
        return testResult;
      }

      // Store configuration
      this.config = config;
      this.connectedAt = new Date();

      // Create client (mock for now)
      this.client = this.createClient(config);

      this.status = 'connected';
      this.lastError = null;
      this.emitConnectionChanged('connected');

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        responseTime
      };
    } catch (error) {
      this.status = 'error';
      this.lastError = error instanceof Error ? error.message : String(error);
      this.emitConnectionChanged('error');

      return {
        success: false,
        error: this.lastError
      };
    }
  }

  /**
   * Disconnect from SymbioseDB
   */
  async disconnect(): Promise<void> {
    this.status = 'disconnected';
    this.config = null;
    this.client = null;
    this.connectedAt = null;
    this.lastError = null;
    this.emitConnectionChanged('disconnected');
  }

  /**
   * Reconnect using stored configuration
   */
  async reconnect(): Promise<ConnectionResult> {
    if (!this.config) {
      return {
        success: false,
        error: 'No stored configuration to reconnect'
      };
    }

    return this.connect(this.config);
  }

  /**
   * Test connection without actually connecting
   */
  async testConnection(config: ConnectionConfig): Promise<ConnectionResult> {
    try {
      const startTime = Date.now();

      // In a real implementation, this would:
      // 1. Make an HTTP request to config.apiUrl/health
      // 2. Verify database connectivity
      // 3. Return success/failure

      // For now, simulate a connection test
      await this.simulateConnectionTest(config.apiUrl);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatusInfo {
    return {
      status: this.status,
      apiUrl: this.config?.apiUrl || null,
      error: this.lastError || undefined,
      connectedAt: this.connectedAt || undefined
    };
  }

  /**
   * Get stored configuration
   */
  getConfig(): ConnectionConfig | null {
    return this.config;
  }

  /**
   * Get client instance
   */
  getClient(): any {
    return this.client;
  }

  /**
   * Register connection change listener
   */
  onConnectionChanged(callback: ConnectionChangedCallback): vscode.Disposable {
    this.listeners.push(callback);

    return new vscode.Disposable(() => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    });
  }

  /**
   * Emit connection changed event
   */
  private emitConnectionChanged(status: ConnectionStatus): void {
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  /**
   * Create client instance
   */
  private createClient(config: ConnectionConfig): any {
    // In a real implementation, this would create an actual SDK client
    // For now, return a mock client
    return {
      config,
      query: async (sql: string) => ({ rows: [] }),
      vectorSearch: async (params: any) => ({ results: [] }),
      graphQuery: async (cypher: string) => ({ nodes: [], relationships: [] }),
      createAttestation: async (data: any) => ({ id: 'mock-id' })
    };
  }

  /**
   * Simulate connection test
   */
  private async simulateConnectionTest(apiUrl: string): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if URL is valid
    try {
      new URL(apiUrl);
    } catch {
      throw new Error(`Invalid API URL: ${apiUrl}`);
    }

    // Simulate success for localhost URLs
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      return;
    }

    // Simulate failure for invalid URLs
    if (apiUrl.includes('invalid')) {
      throw new Error('Connection refused');
    }
  }
}
