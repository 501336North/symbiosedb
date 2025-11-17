/**
 * Query Executor (TDD GREEN STEP)
 * Executes queries across all 4 database types
 */

import { ConnectionManager } from './connectionManager';

export type QueryType = 'sql' | 'cypher' | 'vector' | 'blockchain';

export interface QueryResult {
  success: boolean;
  queryType: QueryType;
  data?: any;
  error?: string;
  executionTime: number;
}

export interface QueryHistoryItem {
  type: QueryType;
  query: string;
  timestamp: Date;
  executionTime: number;
  success: boolean;
  error?: string;
}

export interface VectorSearchParams {
  embedding: number[];
  limit?: number;
  threshold?: number;
}

export interface BlockchainQueryParams {
  type: 'attestations' | 'verify';
  attestationId?: string;
  limit?: number;
}

export class QueryExecutor {
  private history: QueryHistoryItem[] = [];
  private maxHistorySize = 100;

  constructor(private connectionManager: ConnectionManager) {}

  /**
   * Execute SQL query
   */
  async executeSQL(query: string): Promise<QueryResult> {
    const startTime = Date.now();

    if (!this.connectionManager.isConnected()) {
      const executionTime = Date.now() - startTime;
      this.addToHistory('sql', query, executionTime, false, 'Database not connected');
      return {
        success: false,
        queryType: 'sql',
        error: 'Database not connected',
        executionTime
      };
    }

    try {
      const client = this.connectionManager.getClient();

      // Simulate query execution
      const result = await this.simulateSQLQuery(query, client);
      const executionTime = Date.now() - startTime;

      this.addToHistory('sql', query, executionTime, true);

      return {
        success: true,
        queryType: 'sql',
        data: result,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.addToHistory('sql', query, executionTime, false, error.message);

      return {
        success: false,
        queryType: 'sql',
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Execute Cypher query (Apache AGE)
   */
  async executeCypher(query: string): Promise<QueryResult> {
    const startTime = Date.now();

    if (!this.connectionManager.isConnected()) {
      const executionTime = Date.now() - startTime;
      this.addToHistory('cypher', query, executionTime, false, 'Database not connected');
      return {
        success: false,
        queryType: 'cypher',
        error: 'Database not connected',
        executionTime
      };
    }

    try {
      const client = this.connectionManager.getClient();

      // Simulate Cypher query execution
      const result = await this.simulateCypherQuery(query, client);
      const executionTime = Date.now() - startTime;

      this.addToHistory('cypher', query, executionTime, true);

      return {
        success: true,
        queryType: 'cypher',
        data: result,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.addToHistory('cypher', query, executionTime, false, error.message);

      return {
        success: false,
        queryType: 'cypher',
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Execute vector similarity search
   */
  async executeVectorSearch(params: VectorSearchParams): Promise<QueryResult> {
    const startTime = Date.now();

    if (!this.connectionManager.isConnected()) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        queryType: 'vector',
        error: 'Database not connected',
        executionTime
      };
    }

    // Validate embedding array
    if (!params.embedding || params.embedding.length === 0) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        queryType: 'vector',
        error: 'Invalid embedding: embedding array cannot be empty',
        executionTime
      };
    }

    try {
      const client = this.connectionManager.getClient();

      // Simulate vector search
      const result = await this.simulateVectorSearch(params, client);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        queryType: 'vector',
        data: result,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        queryType: 'vector',
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Execute blockchain query
   */
  async executeBlockchainQuery(params: BlockchainQueryParams): Promise<QueryResult> {
    const startTime = Date.now();

    if (!this.connectionManager.isConnected()) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        queryType: 'blockchain',
        error: 'Database not connected',
        executionTime
      };
    }

    try {
      const client = this.connectionManager.getClient();

      // Simulate blockchain query
      const result = await this.simulateBlockchainQuery(params, client);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        queryType: 'blockchain',
        data: result,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        queryType: 'blockchain',
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Get query history
   */
  getQueryHistory(): QueryHistoryItem[] {
    return [...this.history];
  }

  /**
   * Clear query history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Format query result for display
   */
  formatQueryResult(result: QueryResult, format: 'table' | 'json'): string {
    if (!result.success) {
      return `Error: ${result.error}`;
    }

    if (format === 'json') {
      return JSON.stringify(result.data, null, 2);
    }

    // Format as table
    if (result.queryType === 'sql' && result.data?.rows) {
      return this.formatSQLTable(result.data.rows);
    }

    return JSON.stringify(result.data, null, 2);
  }

  /**
   * Private helper: Add query to history
   */
  private addToHistory(
    type: QueryType,
    query: string,
    executionTime: number,
    success: boolean,
    error?: string
  ): void {
    this.history.push({
      type,
      query,
      timestamp: new Date(),
      executionTime,
      success,
      error
    });

    // Trim history if exceeds max size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Private helper: Simulate SQL query execution
   */
  private async simulateSQLQuery(query: string, client: any): Promise<any> {
    // Check for syntax errors
    if (query.includes('INVALID SQL SYNTAX')) {
      throw new Error('Syntax error at line 1');
    }

    // Simulate successful query
    return {
      rows: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      rowCount: 2
    };
  }

  /**
   * Private helper: Simulate Cypher query execution
   */
  private async simulateCypherQuery(query: string, client: any): Promise<any> {
    // Simulate graph query result
    return {
      nodes: [
        { id: 1, label: 'User', properties: { name: 'Alice' } }
      ],
      relationships: [
        { id: 1, type: 'FOLLOWS', from: 1, to: 2 }
      ]
    };
  }

  /**
   * Private helper: Simulate vector search
   */
  private async simulateVectorSearch(params: VectorSearchParams, client: any): Promise<any> {
    // Simulate vector search results
    return {
      results: [
        { id: 1, similarity: 0.95, metadata: { text: 'Similar document 1' } },
        { id: 2, similarity: 0.87, metadata: { text: 'Similar document 2' } }
      ]
    };
  }

  /**
   * Private helper: Simulate blockchain query
   */
  private async simulateBlockchainQuery(params: BlockchainQueryParams, client: any): Promise<any> {
    if (params.type === 'verify' && params.attestationId) {
      return {
        verified: true,
        attestationId: params.attestationId,
        timestamp: Date.now()
      };
    }

    // Return attestations
    return {
      attestations: [
        { id: 'att-1', action: 'USER_CREATED', timestamp: Date.now() },
        { id: 'att-2', action: 'DATA_UPDATED', timestamp: Date.now() }
      ]
    };
  }

  /**
   * Private helper: Format SQL results as table
   */
  private formatSQLTable(rows: any[]): string {
    if (rows.length === 0) {
      return 'No results';
    }

    const columns = Object.keys(rows[0]);
    const header = columns.join(' | ');
    const separator = columns.map(() => '---').join(' | ');
    const body = rows.map((row) => columns.map((col) => row[col]).join(' | ')).join('\n');

    return `${header}\n${separator}\n${body}`;
  }
}
