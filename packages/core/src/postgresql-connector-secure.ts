import { Pool, PoolClient, PoolConfig, QueryResult as PgQueryResult } from 'pg';
import {
  PostgreSQLConfig,
  DatabaseConnector,
  QueryResult,
  Transaction,
} from './types';
import * as crypto from 'crypto';

/**
 * PostgreSQL database connector with advanced security features
 */
export class SecurePostgreSQLConnector implements DatabaseConnector {
  private pool: Pool | null = null;
  private config: PostgreSQLConfig;
  private connected: boolean = false;

  // Security features
  private whitelistedQueries: Map<string, string> = new Map();
  private injectionAttempts: Map<string, number> = new Map();
  private suspiciousQueries: any[] = [];

  // SQL injection patterns
  private readonly sqlInjectionPatterns = [
    // Basic SQL injection
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b.*(\b(FROM|INTO|WHERE|TABLE|DATABASE)\b))/gi,
    /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,

    // Union-based injection
    /\bUNION\b.*\bSELECT\b/gi,

    // Boolean-based blind injection
    /\b(AND|OR)\s+(1\s*=\s*1|1\s*=\s*0|'1'\s*=\s*'1')/gi,

    // Time-based blind injection
    /\b(WAITFOR\s+DELAY|SLEEP|BENCHMARK|pg_sleep)\b/gi,

    // Out-of-band injection
    /\b(xp_cmdshell|xp_dirtree|xp_fileexist|load_file|INTO\s+OUTFILE)\b/gi,

    // Stacked queries
    /;\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)/gi,

    // Comments in non-parameterized queries
    /(--)(?![^']*'[^']*$)/g,

    // Hex encoding
    /0x[0-9a-fA-F]+/g,

    // CHAR encoding
    /\bCHAR\s*\([0-9,\s]+\)/gi,

    // Information schema access
    /\binformation_schema\b/gi,

    // System table access
    /\b(pg_database|pg_user|pg_shadow|pg_tables)\b/gi,

    // File system access
    /\b(COPY|pg_read_file|pg_ls_dir)\b/gi,
  ];

  // Patterns requiring whitelisting
  private readonly dangerousOperations = [
    /^\s*DROP\s+/i,
    /^\s*ALTER\s+/i,
    /^\s*CREATE\s+/i,
    /^\s*TRUNCATE\s+/i,
    /^\s*GRANT\s+/i,
    /^\s*REVOKE\s+/i,
  ];

  constructor(config: PostgreSQLConfig) {
    if (!config) {
      throw new Error('PostgreSQL configuration required');
    }

    if (!config.url || config.url.trim() === '') {
      throw new Error('PostgreSQL URL required');
    }

    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected && this.pool) {
      return;
    }

    const poolConfig: PoolConfig = {
      connectionString: this.config.url,
      max: this.config.maxConnections || 10,
      idleTimeoutMillis: this.config.idleTimeoutMs || 30000,
    };

    this.pool = new Pool(poolConfig);

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

  isConnected(): boolean {
    return this.connected && this.pool !== null;
  }

  /**
   * Validate query for SQL injection attempts
   */
  async validateQuery(sql: string, params?: any[], options?: { source?: string }): Promise<boolean> {
    // Check for concatenated user input
    if (!params || params.length === 0) {
      // Non-parameterized query - check for injection patterns
      for (const pattern of this.sqlInjectionPatterns) {
        if (pattern.test(sql)) {
          const reason = this.getInjectionReason(pattern);
          this.logSuspiciousQuery({
            query: sql,
            reason,
            timestamp: Date.now(),
            source: options?.source,
          });

          if (options?.source) {
            this.trackInjectionAttempt(options.source);
          }

          throw new Error(`Query contains potential SQL injection: ${reason}`);
        }
      }
    }

    // Check for dynamic table/column names (dangerous even with parameters)
    if (/\$\{.*\}/.test(sql) || /\${.*}/.test(sql)) {
      throw new Error('Query contains potential SQL injection: Dynamic table/column names not allowed');
    }

    // Validate parameter count matches placeholders
    const placeholderCount = (sql.match(/\$\d+/g) || []).length;
    const paramCount = params?.length || 0;

    if (placeholderCount !== paramCount) {
      throw new Error(`Parameter count mismatch: Expected ${placeholderCount}, got ${paramCount}`);
    }

    return true;
  }

  /**
   * Get human-readable reason for injection detection
   */
  private getInjectionReason(pattern: RegExp): string {
    const patternMap: Map<string, string> = new Map([
      ['UNION', 'UNION operator detected'],
      ['AND|OR', 'Boolean logic pattern detected'],
      ['WAITFOR|SLEEP', 'Time delay function detected'],
      ['xp_cmdshell', 'System command execution detected'],
      [';.*INSERT|UPDATE', 'Multiple statements detected'],
      ['--', 'SQL comment detected in non-parameterized query'],
      ['0x', 'Hex encoding detected'],
      ['CHAR', 'CHAR encoding detected'],
      ['information_schema', 'Information schema access detected'],
      ['pg_', 'System table access detected'],
      ['COPY', 'File system access detected'],
    ]);

    const patternStr = pattern.toString();
    for (const [key, reason] of patternMap) {
      if (patternStr.includes(key)) {
        return reason;
      }
    }

    return 'Suspicious pattern detected';
  }

  /**
   * Execute query with validation
   */
  async executeQuery(sql: string, params?: any[]): Promise<QueryResult<any>> {
    // Check if query requires whitelisting
    for (const pattern of this.dangerousOperations) {
      if (pattern.test(sql)) {
        const operation = sql.split(/\s+/)[0].toUpperCase();
        throw new Error(`Operation requires whitelisting: ${operation} operations must be explicitly whitelisted`);
      }
    }

    // Validate query
    await this.validateQuery(sql, params);

    // Execute using parent query method
    return this.query(sql, params);
  }

  /**
   * Add whitelisted query
   */
  addWhitelistedQuery(identifier: string, query: string): void {
    this.whitelistedQueries.set(identifier, query);
  }

  /**
   * Execute whitelisted query
   */
  async executeWhitelistedQuery(identifier: string, params?: any[]): Promise<QueryResult<any>> {
    const query = this.whitelistedQueries.get(identifier);

    if (!query) {
      throw new Error(`Query not whitelisted: ${identifier}`);
    }

    return this.query(query, params);
  }

  /**
   * Sanitize identifier (table/column name)
   */
  sanitizeIdentifier(identifier: string): string {
    // Remove everything after semicolon or comment
    let sanitized = identifier.split(/[;\/\*\-\-]/)[0].trim();

    // Only allow alphanumeric, underscore
    sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '_');

    // Must start with letter or underscore
    if (!/^[a-zA-Z_]/.test(sanitized)) {
      throw new Error('Invalid identifier: Must start with letter or underscore');
    }

    // Limit length (PostgreSQL limit is 63)
    if (sanitized.length > 63) {
      sanitized = sanitized.substring(0, 63);
    }

    return sanitized;
  }

  /**
   * Build prepared query from template
   */
  buildPreparedQuery(template: string, params: any[]): { text: string; values: any[] } {
    // Check for string interpolation
    if (template.includes('${') || template.includes("'") && !template.includes('?')) {
      throw new Error('Query must use parameter placeholders for user input');
    }

    // Convert ? placeholders to $1, $2, etc.
    let queryText = template;
    let paramIndex = 1;

    while (queryText.includes('?')) {
      queryText = queryText.replace('?', `$${paramIndex}`);
      paramIndex++;
    }

    return {
      text: queryText,
      values: params,
    };
  }

  /**
   * Log suspicious query
   */
  logSuspiciousQuery(details: any): void {
    this.suspiciousQueries.push(details);

    // In production, this would send to monitoring service
    console.warn('Suspicious query detected:', details);
  }

  /**
   * Track injection attempts
   */
  private trackInjectionAttempt(source: string): void {
    const attempts = this.injectionAttempts.get(source) || 0;
    this.injectionAttempts.set(source, attempts + 1);

    // Trigger alert after threshold
    if (attempts + 1 >= 10) {
      this.triggerSecurityAlert({
        type: 'MULTIPLE_INJECTION_ATTEMPTS',
        source,
        count: attempts + 1,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get injection attempts for a source
   */
  getInjectionAttempts(source: string): number {
    return this.injectionAttempts.get(source) || 0;
  }

  /**
   * Trigger security alert
   */
  triggerSecurityAlert(alert: any): void {
    // In production, this would send to security monitoring
    console.error('SECURITY ALERT:', alert);

    // Could also trigger automatic blocking, rate limiting, etc.
  }

  /**
   * Execute a SQL query with optional parameters (secure version)
   */
  async query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (!this.isConnected() || !this.pool) {
      throw new Error('Not connected to database');
    }

    // Always validate before execution
    await this.validateQuery(sql, params);

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

  async beginTransaction(): Promise<Transaction> {
    if (!this.isConnected() || !this.pool) {
      throw new Error('Not connected to database');
    }

    const client = await this.pool.connect();
    await client.query('BEGIN');

    return new SecurePostgreSQLTransaction(client, this);
  }
}

/**
 * Secure PostgreSQL transaction implementation
 */
class SecurePostgreSQLTransaction implements Transaction {
  private client: PoolClient;
  private connector: SecurePostgreSQLConnector;
  private finished: boolean = false;

  constructor(client: PoolClient, connector: SecurePostgreSQLConnector) {
    this.client = client;
    this.connector = connector;
  }

  async query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (this.finished) {
      throw new Error('Transaction already finished');
    }

    // Use connector's validation
    await this.connector.validateQuery(sql, params);

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

  async rollback(): Promise<void> {
    if (this.finished) {
      return;
    }

    try {
      await this.client.query('ROLLBACK');
    } catch (error) {
      console.error('Rollback error:', error);
    } finally {
      this.finished = true;
      this.client.release();
    }
  }
}

// Export as PostgreSQLConnector for compatibility
export { SecurePostgreSQLConnector as PostgreSQLConnector };