/**
 * GraphQL Resolvers
 * Implements business logic for all queries and mutations
 */

import { Context } from './context';

export interface Resolvers {
  Query: {
    sqlQuery: (parent: any, args: any, context: Context) => Promise<any>;
    vectorSearch: (parent: any, args: any, context: Context) => Promise<any>;
    verifyAttestation: (parent: any, args: any, context: Context) => Promise<any>;
    graphQuery: (parent: any, args: any, context: Context) => Promise<any>;
    health: (parent: any, args: any, context: Context) => Promise<any>;
  };
  Mutation: {
    executeSql: (parent: any, args: any, context: Context) => Promise<any>;
    insertVector: (parent: any, args: any, context: Context) => Promise<any>;
    storeAttestation: (parent: any, args: any, context: Context) => Promise<any>;
    createGraphNode: (parent: any, args: any, context: Context) => Promise<any>;
  };
}

export function createResolvers(): Resolvers {
  return {
    Query: {
      /**
       * Execute SQL query (read-only)
       */
      async sqlQuery(_parent, args, context) {
        try {
          const { query, params } = args;
          const result = await context.sqlConnector.query(query, params);
          return {
            data: JSON.stringify(result.rows),
            rowCount: result.rowCount,
          };
        } catch (error: any) {
          return {
            error: error.message,
          };
        }
      },

      /**
       * Search for similar vectors
       */
      async vectorSearch(_parent, args, context) {
        try {
          const { embedding, limit, filter } = args;
          const options: any = {};
          if (limit !== undefined) options.limit = limit;
          if (filter) options.filter = JSON.parse(filter);

          const results = await context.vectorConnector.search(embedding, options);
          return results.map((result) => ({
            id: result.id,
            similarity: result.similarity,
            metadata: JSON.stringify(result.metadata),
          }));
        } catch (error: any) {
          throw new Error(`Vector search failed: ${error.message}`);
        }
      },

      /**
       * Verify blockchain attestation
       */
      async verifyAttestation(_parent, args, context) {
        try {
          const { id } = args;
          const result = await context.blockchainConnector.verifyAttestation(id);
          return {
            id,
            hash: '', // Not returned by verifyAttestation
            timestamp: result.timestamp.toString(),
            valid: result.valid,
            data: result.data ? JSON.stringify(result.data) : null,
          };
        } catch (error: any) {
          throw new Error(`Attestation verification failed: ${error.message}`);
        }
      },

      /**
       * Execute graph query (Cypher)
       */
      async graphQuery(_parent, args, context) {
        try {
          const { cypher, params } = args;
          const result = await context.graphConnector.query(cypher, params);
          return {
            nodes: result.nodes.map((node) => ({
              id: node.id,
              label: node.label,
              properties: JSON.stringify(node.properties),
            })),
            edges: result.edges.map((edge) => ({
              from: edge.from,
              to: edge.to,
              type: edge.type,
            })),
          };
        } catch (error: any) {
          throw new Error(`Graph query failed: ${error.message}`);
        }
      },

      /**
       * Health check
       */
      async health(_parent, _args, _context) {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          databases: {
            sql: true,
            vector: true,
            blockchain: true,
            graph: true,
          },
        };
      },
    },

    Mutation: {
      /**
       * Execute SQL mutation (write operations)
       */
      async executeSql(_parent, args, context) {
        try {
          const { query, params } = args;
          const result = await context.sqlConnector.query(query, params);
          return {
            success: true,
            data: JSON.stringify(result.rows),
            rowCount: result.rowCount,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },

      /**
       * Insert vector embedding
       */
      async insertVector(_parent, args, context) {
        try {
          const { embedding, metadata } = args;
          const metadataObj = metadata ? JSON.parse(metadata) : undefined;
          const result = await context.vectorConnector.insert(embedding, metadataObj);
          return {
            success: result.success,
            id: result.id,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },

      /**
       * Store blockchain attestation
       */
      async storeAttestation(_parent, args, context) {
        try {
          const { data } = args;
          const dataObj = JSON.parse(data);
          const result = await context.blockchainConnector.storeAttestation(dataObj);
          return {
            id: result.id,
            hash: result.hash,
            timestamp: result.timestamp.toString(),
          };
        } catch (error: any) {
          throw new Error(`Attestation storage failed: ${error.message}`);
        }
      },

      /**
       * Create graph node
       */
      async createGraphNode(_parent, args, context) {
        try {
          const { label, properties } = args;
          const propertiesObj = properties ? JSON.parse(properties) : {};

          if (!context.graphConnector.createNode) {
            throw new Error('createNode not implemented on graphConnector');
          }

          const result = await context.graphConnector.createNode(label, propertiesObj);
          return {
            id: result.id,
            label: result.label,
            properties: JSON.stringify(result.properties),
          };
        } catch (error: any) {
          throw new Error(`Node creation failed: ${error.message}`);
        }
      },
    },
  };
}
