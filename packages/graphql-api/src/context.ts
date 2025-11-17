/**
 * GraphQL Context
 * Provides database connectors to resolvers via dependency injection
 */

export interface SQLConnector {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
}

export interface VectorConnector {
  search: (embedding: number[], options?: { limit?: number; filter?: any }) => Promise<any[]>;
  insert: (embedding: number[], metadata?: any) => Promise<{ id: string; success: boolean }>;
}

export interface BlockchainConnector {
  storeAttestation: (data: any) => Promise<{ id: string; hash: string; timestamp: number }>;
  verifyAttestation: (id: string) => Promise<{ valid: boolean; data: any; timestamp: number }>;
}

export interface GraphConnector {
  query: (cypher: string, params?: any[]) => Promise<{ nodes: any[]; edges: any[] }>;
  createNode?: (label: string, properties: any) => Promise<{ id: string; label: string; properties: any }>;
}

export interface Context {
  sqlConnector: SQLConnector;
  vectorConnector: VectorConnector;
  blockchainConnector: BlockchainConnector;
  graphConnector: GraphConnector;
}

export interface ContextOptions {
  sqlConnector: SQLConnector;
  vectorConnector: VectorConnector;
  blockchainConnector: BlockchainConnector;
  graphConnector: GraphConnector;
}

export function createContext(options: ContextOptions): Context {
  return {
    sqlConnector: options.sqlConnector,
    vectorConnector: options.vectorConnector,
    blockchainConnector: options.blockchainConnector,
    graphConnector: options.graphConnector,
  };
}
