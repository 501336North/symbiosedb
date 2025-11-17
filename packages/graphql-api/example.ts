/**
 * Example: Starting GraphQL Server with Playground
 *
 * This example demonstrates how to start the GraphQL server with all connectors.
 * In production, replace the mock connectors with real database connections.
 */

import { createServer } from './src/server';

// Example connectors (replace with real implementations)
const connectors = {
  sqlConnector: {
    query: async (sql: string, params?: any[]) => {
      console.log('SQL Query:', sql, params);
      // In production: return await postgresClient.query(sql, params);
      return {
        rows: [{ id: 1, name: 'Example User' }],
        rowCount: 1,
      };
    },
  },
  vectorConnector: {
    search: async (embedding: number[], options?: any) => {
      console.log('Vector Search:', embedding, options);
      // In production: return await pgvectorClient.search(embedding, options);
      return [
        { id: 'doc1', similarity: 0.95, metadata: { title: 'Example Doc' } },
      ];
    },
    insert: async (embedding: number[], metadata?: any) => {
      console.log('Vector Insert:', embedding, metadata);
      // In production: return await pgvectorClient.insert(embedding, metadata);
      return { id: 'vec123', success: true };
    },
  },
  blockchainConnector: {
    storeAttestation: async (data: any) => {
      console.log('Store Attestation:', data);
      // In production: return await ethereumClient.storeAttestation(data);
      return {
        id: '0xabc123',
        hash: '0xdef456',
        timestamp: Date.now(),
      };
    },
    verifyAttestation: async (id: string) => {
      console.log('Verify Attestation:', id);
      // In production: return await ethereumClient.verifyAttestation(id);
      return {
        valid: true,
        data: { proof: 'verified' },
        timestamp: Date.now(),
      };
    },
  },
  graphConnector: {
    query: async (cypher: string, params?: any[]) => {
      console.log('Graph Query:', cypher, params);
      // In production: return await neo4jClient.query(cypher, params);
      return {
        nodes: [
          { id: 'node1', label: 'User', properties: { name: 'Alice' } },
        ],
        edges: [
          { from: 'node1', to: 'node2', type: 'FOLLOWS' },
        ],
      };
    },
    createNode: async (label: string, properties: any) => {
      console.log('Create Node:', label, properties);
      // In production: return await neo4jClient.createNode(label, properties);
      return {
        id: 'node123',
        label,
        properties,
      };
    },
  },
};

// Start server
const { server, close } = createServer({
  port: 4000,
  connectors,
  enablePlayground: true,
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await close();
  console.log('✅ Server closed');
  process.exit(0);
});
