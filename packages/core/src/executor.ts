import { QueryRouter } from './query-router';
import {
  Connectors,
  Query,
  QueryResult,
  VectorQuery,
  BlockchainQuery,
  VectorSearchResult,
  AttestationResult,
  PoolConfig,
} from './types';

/**
 * Executor - Integrates QueryRouter with database connectors
 *
 * The Executor is the main entry point for query execution. It:
 * 1. Routes queries using QueryRouter
 * 2. Executes queries on the appropriate connector
 * 3. Returns unified results
 */
export class Executor {
  private router: QueryRouter;
  private connectors: Connectors;
  private poolConfig?: PoolConfig; // Quality Audit Fix: Pool configuration

  constructor(router: QueryRouter, connectors: Connectors, poolConfig?: PoolConfig) {
    if (!router) {
      throw new Error('QueryRouter required');
    }

    if (!connectors) {
      throw new Error('Connectors required');
    }

    if (!connectors.postgresql) {
      throw new Error('PostgreSQL connector required');
    }

    // Quality Audit Fix: Validate pool configuration if provided
    if (poolConfig) {
      this.validatePoolConfig(poolConfig);
    }

    this.router = router;
    this.connectors = connectors;
    this.poolConfig = poolConfig;
  }

  /**
   * Quality Audit Fix: Validate pool configuration
   */
  private validatePoolConfig(config: PoolConfig): void {
    if (config.min !== undefined && config.min < 0) {
      throw new Error('Pool limits must be positive');
    }

    if (config.max !== undefined && config.max < 0) {
      throw new Error('Pool limits must be positive');
    }

    if (config.min !== undefined && config.max !== undefined) {
      if (config.max < config.min) {
        throw new Error('Pool max must be greater than or equal to min');
      }
    }
  }

  /**
   * Connect all available connectors
   * Quality Audit Fix: Pass pool config to database connectors
   */
  async connect(): Promise<void> {
    const connections: Promise<void>[] = [];

    // Always connect PostgreSQL with pool config
    const postgresConnect = this.poolConfig
      ? this.connectors.postgresql.connect(this.poolConfig)
      : this.connectors.postgresql.connect();
    connections.push(postgresConnect);

    // Connect optional connectors if available
    if (this.connectors.vector) {
      const vectorConnect = this.poolConfig
        ? this.connectors.vector.connect(this.poolConfig)
        : this.connectors.vector.connect();
      connections.push(vectorConnect);
    }

    // Blockchain doesn't use connection pools
    if (this.connectors.blockchain) {
      connections.push(this.connectors.blockchain.connect());
    }

    await Promise.all(connections);
  }

  /**
   * Disconnect all connectors
   */
  async disconnect(): Promise<void> {
    const disconnections: Promise<void>[] = [];

    disconnections.push(this.connectors.postgresql.disconnect());

    if (this.connectors.vector) {
      disconnections.push(this.connectors.vector.disconnect());
    }

    if (this.connectors.blockchain) {
      disconnections.push(this.connectors.blockchain.disconnect());
    }

    await Promise.all(disconnections);
  }

  /**
   * Check if all connectors are connected
   */
  isConnected(): boolean {
    if (!this.connectors.postgresql.isConnected()) {
      return false;
    }

    if (this.connectors.vector && !this.connectors.vector.isConnected()) {
      return false;
    }

    if (this.connectors.blockchain && !this.connectors.blockchain.isConnected()) {
      return false;
    }

    return true;
  }

  /**
   * Execute a query by routing it to the appropriate connector
   */
  async execute<T = any>(
    query: Query,
    params?: any[]
  ): Promise<QueryResult<T> | VectorSearchResult[] | AttestationResult | { attestationId: string }> {
    if (!this.isConnected()) {
      throw new Error('Not connected to database');
    }

    // Route the query
    const route = await this.router.determineRoute(query);

    // Execute based on route decision
    switch (route.database) {
      case 'postgresql':
      case 'graph':
        // Both SQL and Graph queries go to PostgreSQL
        return this.connectors.postgresql.query<T>(query as string, params);

      case 'vector':
        return this.executeVectorQuery(query as VectorQuery);

      case 'blockchain':
        return this.executeBlockchainQuery(query as BlockchainQuery);

      default:
        throw new Error(`Unsupported database type: ${route.database}`);
    }
  }

  /**
   * Execute a vector search query
   */
  private async executeVectorQuery(
    query: VectorQuery
  ): Promise<VectorSearchResult[]> {
    if (!this.connectors.vector) {
      throw new Error('Vector connector not available');
    }

    const options = {
      limit: query.limit,
      filter: query.filter,
    };

    return this.connectors.vector.search(query.embedding, options);
  }

  /**
   * Execute a blockchain query
   */
  private async executeBlockchainQuery(
    query: BlockchainQuery
  ): Promise<AttestationResult | { attestationId: string }> {
    if (!this.connectors.blockchain) {
      throw new Error('Blockchain connector not available');
    }

    if (query.type === 'store_attestation') {
      const attestationId = await this.connectors.blockchain.storeAttestation(
        query.data
      );
      return { attestationId };
    }

    if (query.type === 'verify_attestation') {
      if (!query.attestationId) {
        throw new Error('Attestation ID required for verification');
      }
      return this.connectors.blockchain.verifyAttestation(query.attestationId);
    }

    throw new Error(`Unsupported blockchain query type: ${query.type}`);
  }
}
