/**
 * Configuration for PostgreSQL database connection
 * Accepts either 'url' or 'connectionString' for maximum compatibility
 */
export interface PostgreSQLConfig {
  url?: string;
  connectionString?: string; // Alias for 'url' (DX Fix #2)
  maxConnections?: number;
  idleTimeoutMs?: number;
}

/**
 * Configuration for Vector database connection
 */
export interface VectorConfig {
  url?: string;
  connectionString?: string; // Alias for 'url' (DX Fix #2)
  apiKey?: string;
  collection?: string;
}

/**
 * Configuration for Blockchain connection
 */
export interface BlockchainConfig {
  network: 'arbitrum' | 'optimism' | 'base' | 'ethereum';
  rpcUrl: string;
  privateKey?: string;
  contractAddress?: string; // Quality Audit Fix: Required for production
}

/**
 * Complete database configuration for SymbioseDB
 */
export interface DatabaseConfig {
  postgresql: PostgreSQLConfig;
  vector: VectorConfig;
  blockchain: BlockchainConfig;
}

/**
 * Supported database types in SymbioseDB
 */
export type DatabaseType = 'postgresql' | 'graph' | 'vector' | 'blockchain';

/**
 * Query types that can be routed
 */
export type QueryType =
  | 'sql'
  | 'graph_traversal'
  | 'similarity_search'
  | 'verification'
  | 'unknown';

/**
 * Query routing decision
 */
export interface RouteDecision {
  database: DatabaseType;
  queryType: QueryType;
  metadata?: Record<string, any>;
}

/**
 * Query input types
 */
export type Query = string | VectorQuery | BlockchainQuery | object;

export interface VectorQuery {
  type: 'vector_search';
  embedding: number[];
  limit?: number;
  filter?: Record<string, any>;
}

export interface BlockchainQuery {
  type: 'verify_attestation' | 'store_attestation';
  attestationId?: string;
  data?: any;
}

/**
 * Result from a database query execution
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields?: QueryResultField[];
  command?: string;
}

/**
 * Field metadata from query results
 */
export interface QueryResultField {
  name: string;
  dataTypeID?: number;
}

/**
 * Database connector interface
 */
export interface DatabaseConnector {
  connect(poolConfig?: PoolConfig): Promise<void>; // Quality Audit Fix: Accept optional pool config
  disconnect(): Promise<void>;
  isConnected(): boolean;
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
}

/**
 * Transaction interface for database operations
 */
export interface Transaction {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Vector database connector interface
 */
export interface VectorConnector {
  connect(poolConfig?: PoolConfig): Promise<void>; // Quality Audit Fix: Accept optional pool config
  disconnect(): Promise<void>;
  isConnected(): boolean;
  search(embedding: number[], options?: VectorSearchOptions): Promise<VectorSearchResult[]>;
  insert(id: string, embedding: number[], metadata?: Record<string, any>): Promise<void>;
}

/**
 * Vector search options
 */
export interface VectorSearchOptions {
  limit?: number;
  filter?: Record<string, any>;
  threshold?: number;
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Blockchain connector interface
 */
export interface BlockchainConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  storeAttestation(data: any): Promise<string>;
  verifyAttestation(attestationId: string): Promise<AttestationResult>;
}

/**
 * Attestation verification result
 */
export interface AttestationResult {
  valid: boolean;
  data?: any;
  timestamp?: Date;
  blockNumber?: number;
}

/**
 * Connectors for all database types
 */
export interface Connectors {
  postgresql: DatabaseConnector;
  vector?: VectorConnector;
  blockchain?: BlockchainConnector;
}

/**
 * Connection pool configuration (Quality Audit Fix)
 * Prevents connection exhaustion under load
 */
export interface PoolConfig {
  min?: number; // Minimum connections to maintain
  max?: number; // Maximum connections allowed
  acquireTimeoutMillis?: number; // Timeout for acquiring connection
  idleTimeoutMillis?: number; // Timeout for idle connections
  enableHealthCheck?: boolean; // Enable periodic health checks
  healthCheckIntervalMs?: number; // Health check interval
}
