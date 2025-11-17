import {
  DatabaseConfig,
  Query,
  RouteDecision,
  VectorQuery,
  BlockchainQuery,
  DatabaseType,
  QueryType,
} from './types';

/**
 * QueryRouter - Intelligently routes queries to the appropriate database
 *
 * This is the core routing engine of DataSapiens. It analyzes incoming queries
 * and determines which database (PostgreSQL, Graph, Vector, or Blockchain) should
 * handle each query based on the query structure and type.
 */
export class QueryRouter {
  public readonly config: DatabaseConfig;

  // Quality Audit Fix: Pre-compile regex patterns (avoid recompilation on every query)
  private readonly graphPatterns: RegExp[] = [
    /^MATCH\s+/,
    /^CREATE\s+\(/,
    /^MERGE\s+/,
    /\-\[.*\]\-/, // Relationship patterns like -[:FOLLOWS]->
  ];

  private readonly sqlPatterns: RegExp[] = [
    /^SELECT\s+/,
    /^INSERT\s+/,
    /^UPDATE\s+/,
    /^DELETE\s+/,
    /^CREATE\s+TABLE/,
    /^ALTER\s+/,
    /^DROP\s+/,
  ];

  constructor(config: DatabaseConfig) {
    // Validate configuration is provided
    if (!config) {
      throw new Error('Configuration required');
    }

    // Validate PostgreSQL configuration
    if (!config.postgresql) {
      throw new Error('PostgreSQL configuration required');
    }

    // Validate Vector database configuration
    if (!config.vector) {
      throw new Error('Vector database configuration required');
    }

    // Validate Blockchain configuration
    if (!config.blockchain) {
      throw new Error('Blockchain configuration required');
    }

    this.config = config;
  }

  /**
   * Determines which database should handle the given query
   *
   * @param query - The query to route (can be SQL string, vector search, blockchain query, etc.)
   * @returns RouteDecision indicating which database to use
   */
  async determineRoute(query: Query): Promise<RouteDecision> {
    // Validate query is provided
    if (query === null || query === undefined) {
      throw new Error('Invalid query format');
    }

    // Handle string queries (SQL or Graph)
    if (typeof query === 'string') {
      return this.routeStringQuery(query);
    }

    // Handle object queries (Vector or Blockchain)
    if (typeof query === 'object') {
      return this.routeObjectQuery(query);
    }

    throw new Error('Unsupported query type');
  }

  /**
   * Routes string-based queries (SQL or Graph queries)
   */
  private routeStringQuery(query: string): RouteDecision {
    const upperQuery = query.trim().toUpperCase();

    // Check for graph query patterns (Cypher-like)
    if (this.isGraphQuery(upperQuery)) {
      return {
        database: 'graph',
        queryType: 'graph_traversal',
      };
    }

    // Check for SQL query patterns
    if (this.isSQLQuery(upperQuery)) {
      return {
        database: 'postgresql',
        queryType: 'sql',
      };
    }

    throw new Error('Unsupported query type');
  }

  /**
   * Routes object-based queries (Vector or Blockchain)
   */
  private routeObjectQuery(query: object): RouteDecision {
    // Type guard for VectorQuery
    if (this.isVectorQuery(query)) {
      return {
        database: 'vector',
        queryType: 'similarity_search',
      };
    }

    // Type guard for BlockchainQuery
    if (this.isBlockchainQuery(query)) {
      return {
        database: 'blockchain',
        queryType: 'verification',
      };
    }

    throw new Error('Unsupported query type');
  }

  /**
   * Checks if a string query is a graph traversal query
   * Quality Audit Fix: Uses pre-compiled regex patterns
   */
  private isGraphQuery(query: string): boolean {
    return this.graphPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Checks if a string query is a SQL query
   * Quality Audit Fix: Uses pre-compiled regex patterns
   */
  private isSQLQuery(query: string): boolean {
    return this.sqlPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Type guard for VectorQuery
   */
  private isVectorQuery(query: any): query is VectorQuery {
    return (
      query &&
      query.type === 'vector_search' &&
      Array.isArray(query.embedding) &&
      query.embedding.length > 0
    );
  }

  /**
   * Type guard for BlockchainQuery
   */
  private isBlockchainQuery(query: any): query is BlockchainQuery {
    return (
      query &&
      (query.type === 'verify_attestation' || query.type === 'store_attestation')
    );
  }
}
