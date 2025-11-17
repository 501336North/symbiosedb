import { Pool, PoolClient, PoolConfig, QueryResult as PgQueryResult } from 'pg';
import {
  PostgreSQLConfig,
  DatabaseConnector,
  QueryResult,
  Transaction,
} from './types';

/**
 * PostgreSQL database connector with connection pooling
 */
export class PostgreSQLConnector implements DatabaseConnector {
  private pool: Pool | null = null;
  private config: PostgreSQLConfig;
  private connected: boolean = false;
  private whitelistedQueries: Map<string, string> = new Map();
  private suspiciousQueryLog: Array<{ query: string; reason: string; timestamp: number }> = [];
  private injectionAttempts: Map<string, number> = new Map();
  private readonly INJECTION_ALERT_THRESHOLD = 10;

  constructor(config: PostgreSQLConfig) {
    if (!config) {
      throw new Error('PostgreSQL configuration required');
    }

    // DX Fix #2: Accept both 'url' and 'connectionString' (prefer 'url')
    const actualUrl = config.url || config.connectionString;

    if (!actualUrl || actualUrl.trim() === '') {
      throw new Error('PostgreSQL URL or connectionString required');
    }

    // Normalize config to always use 'url' internally
    this.config = {
      ...config,
      url: actualUrl,
    };
  }

  /**
   * Connect to PostgreSQL database
   */
  async connect(): Promise<void> {
    if (this.connected && this.pool) {
      // Already connected, skip
      return;
    }

    const poolConfig: PoolConfig = {
      connectionString: this.config.url,
      max: this.config.maxConnections || 10,
      idleTimeoutMillis: this.config.idleTimeoutMs || 30000,
    };

    this.pool = new Pool(poolConfig);

    // Test the connection
    try {
      const client = await this.pool.connect();
      client.release();
      this.connected = true;
    } catch (error) {
      this.pool = null;
      this.connected = false;
      throw new Error(
        `Failed to connect to PostgreSQL: ${(error as Error).message}`
      );
    }
  }

  /**
   * Disconnect from PostgreSQL database
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      this.connected = false;
      return;
    }

    try {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
    } catch (error) {
      throw new Error(
        `Failed to disconnect from PostgreSQL: ${(error as Error).message}`
      );
    }
  }

  /**
   * Check if connected to database
   */
  isConnected(): boolean {
    return this.connected && this.pool !== null;
  }

  /**
   * Execute a SQL query with optional parameters
   */
  async query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (!this.isConnected() || !this.pool) {
      throw new Error('Not connected to database');
    }

    try {
      const result: PgQueryResult = await this.pool.query(sql, params);

      return {
        rows: result.rows as T[],
        rowCount: result.rowCount || 0,
        fields: result.fields?.map((field) => ({
          name: field.name,
          dataTypeID: field.dataTypeID,
        })),
        command: result.command,
      };
    } catch (error) {
      throw new Error(
        `Query execution failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Begin a new transaction
   */
  async beginTransaction(): Promise<Transaction> {
    if (!this.isConnected() || !this.pool) {
      throw new Error('Not connected to database');
    }

    const client = await this.pool.connect();
    await client.query('BEGIN');

    return new PostgreSQLTransaction(client);
  }

  /**
   * Validate query for SQL injection patterns
   */
  async validateQuery(sql: string, params: any[], options?: { source?: string }): Promise<boolean> {
    const logAndThrow = (reason: string) => {
      this.logSuspiciousQuery({ query: sql, reason, timestamp: Date.now() });
      if (options?.source) {
        const count = (this.injectionAttempts.get(options.source) || 0) + 1;
        this.injectionAttempts.set(options.source, count);
        if (count >= this.INJECTION_ALERT_THRESHOLD) {
          this.triggerSecurityAlert({
            type: 'MULTIPLE_INJECTION_ATTEMPTS',
            source: options.source,
            count,
          });
        }
      }
      throw new Error(`Query contains potential SQL injection: ${reason}`);
    };

    // Calculate properties we'll need for multiple checks
    const hasMultipleStatements = sql.includes(';') && sql.split(';').filter(s => s.trim()).length > 1;
    const hasWhereOrSet = !!sql.match(/WHERE|SET/i);
    const hasParameters = params.length > 0 || !!sql.match(/\$\d+/);

    // Check all specific patterns FIRST (most specific to least specific)
    // This ensures we report the most accurate security issue

    // Priority 1: System command execution (highly critical) - Out-of-band injection
    if (!!sql.match(/xp_cmdshell/i) || !!sql.match(/EXEC\s+master/i) || !!sql.match(/COPY\s+.*FROM\s+PROGRAM/i)) {
      logAndThrow('System command execution detected');
    }

    // Priority 2: Time-based blind injection
    if (!!sql.match(/WAITFOR\s+DELAY/i) || !!sql.match(/SLEEP\s*\(/i) || !!sql.match(/BENCHMARK\s*\(/i) || !!sql.match(/pg_sleep\s*\(/i)) {
      logAndThrow('Time delay function detected');
    }

    // Priority 3: Stacked queries with data manipulation (INSERT/UPDATE/DELETE after semicolon)
    // Must check BEFORE general multi-statement check
    if (hasMultipleStatements && !!sql.match(/;\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)/i)) {
      logAndThrow('Multiple statements detected');
    }

    // Priority 4: Direct string concatenation with template literals OR missing parameters
    const directConcat = hasWhereOrSet && !hasParameters && hasMultipleStatements;
    if (sql.includes('${') || directConcat) {
      logAndThrow('Direct string concatenation detected');
    }

    // Priority 5: Dynamic table/column names (check for semicolon after FROM keyword)
    if (hasMultipleStatements && !!sql.match(/FROM\s+[^;]*;/i) && !hasWhereOrSet) {
      logAndThrow('Dynamic table/column names not allowed');
    }

    // Priority 6: UNION-based injection
    if (!!sql.match(/UNION\s+(ALL\s+)?SELECT/i)) {
      logAndThrow('UNION operator detected');
    }

    // Priority 7: Boolean-based blind injection
    if (!!sql.match(/\s+AND\s+\d+\s*=\s*\d+/i) || !!sql.match(/\s+OR\s+\d+\s*=\s*\d+/i)) {
      logAndThrow('Boolean logic pattern detected');
    }

    // Priority 8: SQL comments in non-parameterized queries
    if ((sql.includes('--') || sql.includes('/*')) && params.length === 0) {
      logAndThrow('SQL comment detected in non-parameterized query');
    }

    // Priority 9: Hex encoding
    if (!!sql.match(/0x[0-9a-f]+/i)) {
      logAndThrow('Hex encoding detected');
    }

    // Priority 10: CHAR encoding
    if (!!sql.match(/CHAR\s*\(/i)) {
      logAndThrow('CHAR encoding detected');
    }

    // Priority 11: Information schema access
    if (!!sql.match(/information_schema/i)) {
      logAndThrow('Information schema access detected');
    }

    // Priority 12: System table access
    if (!!sql.match(/pg_database/i) || !!sql.match(/pg_/i)) {
      logAndThrow('System table access detected');
    }

    // Priority 13: File system access
    if (!!sql.match(/COPY\s+\w+\s+FROM/i)) {
      logAndThrow('File system access detected');
    }

    // Priority 14: Generic multiple statements (catch-all for any remaining cases)
    if (hasMultipleStatements) {
      logAndThrow('Multiple statements detected');
    }

    // Validate parameter count matches placeholders
    const placeholderCount = (sql.match(/\$\d+/g) || []).length;
    if (placeholderCount !== params.length) {
      throw new Error(`Parameter count mismatch: Expected ${placeholderCount}, got ${params.length}`);
    }

    return true;
  }

  /**
   * Execute query with validation
   */
  async executeQuery(sql: string, params?: any[]): Promise<QueryResult<any>> {
    // Check for sensitive operations that require whitelisting
    const sensitiveOps = ['DROP', 'ALTER', 'CREATE', 'TRUNCATE'];
    for (const op of sensitiveOps) {
      if (sql.trim().toUpperCase().startsWith(op)) {
        throw new Error(`Operation requires whitelisting: ${op} operations must be explicitly whitelisted`);
      }
    }

    // Validate query for injection patterns
    await this.validateQuery(sql, params || []);

    // Execute the query
    return this.query(sql, params);
  }

  /**
   * Add a whitelisted query for sensitive operations
   */
  addWhitelistedQuery(name: string, sql: string): void {
    this.whitelistedQueries.set(name, sql);
  }

  /**
   * Execute a whitelisted query
   */
  async executeWhitelistedQuery(name: string, params?: any[]): Promise<QueryResult<any>> {
    const sql = this.whitelistedQueries.get(name);

    if (!sql) {
      throw new Error(`Query not whitelisted: ${name}`);
    }

    return this.query(sql, params);
  }

  /**
   * Sanitize identifier (table/column names)
   */
  sanitizeIdentifier(identifier: string): string {
    // Must start with letter or underscore
    if (!/^[a-zA-Z_]/.test(identifier)) {
      throw new Error('Invalid identifier: Must start with letter or underscore');
    }

    // First, convert hyphens to underscores
    let sanitized = identifier.replace(/-/g, '_');

    // Remove any SQL injection attempts (split on dangerous characters)
    sanitized = sanitized.split(/[;\/\*]/).shift() || '';

    // Remove any non-alphanumeric characters except underscore
    sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');

    // Limit length to PostgreSQL's identifier limit
    if (sanitized.length > 63) {
      sanitized = sanitized.substring(0, 63);
    }

    return sanitized;
  }

  /**
   * Build a prepared query from a query with ? placeholders
   */
  buildPreparedQuery(sql: string, values: any[]): { text: string; values: any[] } {
    // Check if query contains direct string interpolation (embedded values)
    if (sql.includes('${') || sql.match(/=\s*['"][^'"]+['"]/)) {
      throw new Error('Query must use parameter placeholders for user input');
    }

    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 0;
    const text = sql.replace(/\?/g, () => `$${++paramIndex}`);

    return { text, values };
  }

  /**
   * Log a suspicious query
   */
  logSuspiciousQuery(log: { query: string; reason: string; timestamp: number }): void {
    this.suspiciousQueryLog.push(log);
  }

  /**
   * Get injection attempts count for a source
   */
  getInjectionAttempts(source: string): number {
    return this.injectionAttempts.get(source) || 0;
  }

  /**
   * Trigger a security alert
   */
  triggerSecurityAlert(alert: { type: string; source: string; count: number }): void {
    // In production, this would send to monitoring system
    console.warn(`[SECURITY ALERT] ${alert.type} from ${alert.source}: ${alert.count} attempts`);
  }
}

/**
 * PostgreSQL transaction implementation
 */
class PostgreSQLTransaction implements Transaction {
  private client: PoolClient;
  private finished: boolean = false;

  constructor(client: PoolClient) {
    this.client = client;
  }

  /**
   * Execute a query within the transaction
   */
  async query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (this.finished) {
      throw new Error('Transaction already finished');
    }

    try {
      const result: PgQueryResult = await this.client.query(sql, params);

      return {
        rows: result.rows as T[],
        rowCount: result.rowCount || 0,
        fields: result.fields?.map((field) => ({
          name: field.name,
          dataTypeID: field.dataTypeID,
        })),
        command: result.command,
      };
    } catch (error) {
      throw new Error(
        `Transaction query failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (this.finished) {
      throw new Error('Transaction already finished');
    }

    try {
      await this.client.query('COMMIT');
      this.finished = true;
      this.client.release();
    } catch (error) {
      await this.rollback();
      throw new Error(
        `Transaction commit failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    if (this.finished) {
      return; // Already finished
    }

    try {
      await this.client.query('ROLLBACK');
    } catch (error) {
      // Rollback errors are logged but not thrown
      console.error('Rollback error:', error);
    } finally {
      this.finished = true;
      this.client.release();
    }
  }
}
