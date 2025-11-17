/**
 * GraphQL Schema Definition
 * Defines types, queries, and mutations for SymbioseDB unified API
 */

import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLBoolean, GraphQLInt, GraphQLFloat, GraphQLList, GraphQLNonNull, GraphQLID } from 'graphql';
import { createResolvers } from './resolvers';

// Custom Types

const SQLResultType = new GraphQLObjectType({
  name: 'SQLResult',
  fields: {
    success: { type: new GraphQLNonNull(GraphQLBoolean) },
    data: { type: GraphQLString },
    rowCount: { type: GraphQLInt },
    error: { type: GraphQLString },
  },
});

const VectorSearchResultType = new GraphQLObjectType({
  name: 'VectorSearchResult',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    similarity: { type: new GraphQLNonNull(GraphQLFloat) },
    metadata: { type: GraphQLString },
  },
});

const VectorInsertResultType = new GraphQLObjectType({
  name: 'VectorInsertResult',
  fields: {
    success: { type: new GraphQLNonNull(GraphQLBoolean) },
    id: { type: GraphQLString },
    error: { type: GraphQLString },
  },
});

const AttestationType = new GraphQLObjectType({
  name: 'Attestation',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    hash: { type: new GraphQLNonNull(GraphQLString) },
    timestamp: { type: new GraphQLNonNull(GraphQLString) },
    valid: { type: GraphQLBoolean },
    data: { type: GraphQLString },
  },
});

const GraphNodeType = new GraphQLObjectType({
  name: 'GraphNode',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    label: { type: new GraphQLNonNull(GraphQLString) },
    properties: { type: GraphQLString },
  },
});

const GraphEdgeType = new GraphQLObjectType({
  name: 'GraphEdge',
  fields: {
    from: { type: new GraphQLNonNull(GraphQLString) },
    to: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const GraphQueryResultType = new GraphQLObjectType({
  name: 'GraphQueryResult',
  fields: {
    nodes: { type: new GraphQLList(GraphNodeType) },
    edges: { type: new GraphQLList(GraphEdgeType) },
  },
});

const DatabaseStatusType = new GraphQLObjectType({
  name: 'DatabaseStatus',
  fields: {
    sql: { type: new GraphQLNonNull(GraphQLBoolean) },
    vector: { type: new GraphQLNonNull(GraphQLBoolean) },
    blockchain: { type: new GraphQLNonNull(GraphQLBoolean) },
    graph: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
});

const HealthStatusType = new GraphQLObjectType({
  name: 'HealthStatus',
  fields: {
    status: { type: new GraphQLNonNull(GraphQLString) },
    timestamp: { type: new GraphQLNonNull(GraphQLString) },
    databases: { type: new GraphQLNonNull(DatabaseStatusType) },
  },
});

// Build Schema
export function buildSchema(): GraphQLSchema {
  const resolvers = createResolvers();

  // Query Type
  const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
      sqlQuery: {
        type: SQLResultType,
        args: {
          query: { type: new GraphQLNonNull(GraphQLString) },
          params: { type: new GraphQLList(GraphQLString) },
        },
        resolve: resolvers.Query.sqlQuery,
      },
      vectorSearch: {
        type: new GraphQLList(VectorSearchResultType),
        args: {
          embedding: { type: new GraphQLNonNull(new GraphQLList(GraphQLFloat)) },
          limit: { type: GraphQLInt },
          filter: { type: GraphQLString },
        },
        resolve: resolvers.Query.vectorSearch,
      },
      verifyAttestation: {
        type: AttestationType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: resolvers.Query.verifyAttestation,
      },
      graphQuery: {
        type: GraphQueryResultType,
        args: {
          cypher: { type: new GraphQLNonNull(GraphQLString) },
          params: { type: new GraphQLList(GraphQLString) },
        },
        resolve: resolvers.Query.graphQuery,
      },
      health: {
        type: HealthStatusType,
        resolve: resolvers.Query.health,
      },
    },
  });

  // Mutation Type
  const MutationType = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      executeSql: {
        type: SQLResultType,
        args: {
          query: { type: new GraphQLNonNull(GraphQLString) },
          params: { type: new GraphQLList(GraphQLString) },
        },
        resolve: resolvers.Mutation.executeSql,
      },
      insertVector: {
        type: VectorInsertResultType,
        args: {
          embedding: { type: new GraphQLNonNull(new GraphQLList(GraphQLFloat)) },
          metadata: { type: GraphQLString },
        },
        resolve: resolvers.Mutation.insertVector,
      },
      storeAttestation: {
        type: AttestationType,
        args: {
          data: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: resolvers.Mutation.storeAttestation,
      },
      createGraphNode: {
        type: GraphNodeType,
        args: {
          label: { type: new GraphQLNonNull(GraphQLString) },
          properties: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: resolvers.Mutation.createGraphNode,
      },
    },
  });

  return new GraphQLSchema({
    query: QueryType,
    mutation: MutationType,
  });
}
