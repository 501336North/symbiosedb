# 🚀 @symbiosedb/graphql-api

> **GraphQL API for SymbioseDB** — Query 4 databases (SQL, Vector, Graph, Blockchain) through one unified GraphQL API.

[![Tests](https://img.shields.io/badge/tests-18%2F18%20passing-brightgreen)](./src/__tests__)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./src/__tests__)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## 📖 Table of Contents

- [Why GraphQL API?](#-why-graphql-api)
- [Architecture](#-architecture)
- [Quick Start (5 Minutes)](#-quick-start-5-minutes)
- [API Reference](#-api-reference)
  - [Queries](#queries)
  - [Mutations](#mutations)
- [Cheat Sheet](#-cheat-sheet)
- [Advanced Usage](#-advanced-usage)
- [Playground](#-interactive-playground)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Why GraphQL API?

Stop writing custom API endpoints for every database operation. SymbioseDB's GraphQL API gives you:

✅ **One unified interface** for SQL, Vector, Graph, and Blockchain queries
✅ **Type-safe queries** with full TypeScript support
✅ **Interactive Playground** for API exploration
✅ **Automatic documentation** via GraphQL introspection
✅ **Flexible querying** — request exactly the data you need
✅ **Real-time subscriptions** (coming soon)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│            GraphQL API (Port 4000)                  │
│  ┌──────────────┐  ┌─────────────────────────────┐ │
│  │   Schema     │  │       Resolvers             │ │
│  │  (Types &    │  │  (Business Logic)           │ │
│  │   Queries)   │  │                             │ │
│  └──────┬───────┘  └────────┬────────────────────┘ │
│         │                   │                       │
│         └───────────────────┘                       │
│                     │                               │
└─────────────────────┼───────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │   Context Factory     │
          │  (Dependency Injection)│
          └───────────┬───────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼────┐  ┌────▼─────┐  ┌───▼──────┐
│ PostgreSQL │  │ pgvector │  │ Ethereum │
│  Connector │  │ Connector│  │ Connector│
└────────────┘  └──────────┘  └──────────┘
        │             │             │
┌───────▼────┐  ┌────▼─────┐  ┌───▼──────┐
│ PostgreSQL │  │ pgvector │  │ Ethereum │
│  Database  │  │ Database │  │    L2    │
└────────────┘  └──────────┘  └──────────┘
                      │
                ┌─────▼──────┐
                │ Apache AGE │
                │  (Graph)   │
                └────────────┘
```

---

## 🚀 Quick Start (5 Minutes)

### 1️⃣ Install

```bash
npm install @symbiosedb/graphql-api
# or
yarn add @symbiosedb/graphql-api
```

### 2️⃣ Set Up Database Connectors

```typescript
import { createServer } from '@symbiosedb/graphql-api';

const connectors = {
  sqlConnector: {
    query: async (sql, params) => {
      // Connect to PostgreSQL
      return await postgresClient.query(sql, params);
    },
  },
  vectorConnector: {
    search: async (embedding, options) => {
      // Connect to pgvector
      return await pgvectorClient.search(embedding, options);
    },
    insert: async (embedding, metadata) => {
      return await pgvectorClient.insert(embedding, metadata);
    },
  },
  blockchainConnector: {
    storeAttestation: async (data) => {
      // Connect to Ethereum L2
      return await ethereumClient.storeAttestation(data);
    },
    verifyAttestation: async (id) => {
      return await ethereumClient.verifyAttestation(id);
    },
  },
  graphConnector: {
    query: async (cypher, params) => {
      // Connect to Apache AGE (graph)
      return await ageClient.query(cypher, params);
    },
    createNode: async (label, properties) => {
      return await ageClient.createNode(label, properties);
    },
  },
};
```

### 3️⃣ Start Server

```typescript
const { server } = createServer({
  port: 4000,
  connectors,
  enablePlayground: true,
});
```

### 4️⃣ Open Playground

Visit **http://localhost:4000/playground** and start querying!

```graphql
query GetHealth {
  health {
    status
    timestamp
    databases {
      sql
      vector
      blockchain
      graph
    }
  }
}
```

**Result:**
```json
{
  "data": {
    "health": {
      "status": "healthy",
      "timestamp": "2025-11-14T12:00:00.000Z",
      "databases": {
        "sql": true,
        "vector": true,
        "blockchain": true,
        "graph": true
      }
    }
  }
}
```

✅ **Done!** You now have a unified GraphQL API for 4 databases.

---

## 📚 API Reference

### Queries

#### 🔍 `sqlQuery`

Execute SQL SELECT queries (read-only).

**Arguments:**
- `query: String!` — SQL query to execute
- `params: [String]` — Query parameters (optional)

**Returns:**
```graphql
type SQLResult {
  data: String
  rowCount: Int
}
```

**Example:**
```graphql
query GetUsers {
  sqlQuery(
    query: "SELECT * FROM users WHERE age > $1"
    params: ["25"]
  ) {
    data
    rowCount
  }
}
```

**Response:**
```json
{
  "data": {
    "sqlQuery": {
      "data": "[{\"id\":1,\"name\":\"Alice\",\"age\":30}]",
      "rowCount": 1
    }
  }
}
```

---

#### 🔍 `vectorSearch`

Search for similar vectors using cosine similarity.

**Arguments:**
- `embedding: [Float]!` — Query vector
- `limit: Int` — Max results (default: 10)
- `filter: String` — JSON filter (optional)

**Returns:**
```graphql
type VectorSearchResult {
  id: String!
  similarity: Float!
  metadata: String
}
```

**Example:**
```graphql
query SearchSimilarDocs {
  vectorSearch(
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
    limit: 5
    filter: "{\"category\":\"tech\"}"
  ) {
    id
    similarity
    metadata
  }
}
```

**Response:**
```json
{
  "data": {
    "vectorSearch": [
      {
        "id": "doc1",
        "similarity": 0.95,
        "metadata": "{\"title\":\"AI Guide\",\"category\":\"tech\"}"
      }
    ]
  }
}
```

---

#### 🔍 `verifyAttestation`

Verify blockchain attestation by ID.

**Arguments:**
- `id: String!` — Attestation ID

**Returns:**
```graphql
type Attestation {
  id: String!
  hash: String!
  timestamp: String!
  valid: Boolean
  data: String
}
```

**Example:**
```graphql
query VerifyProof {
  verifyAttestation(id: "0xabc123") {
    id
    valid
    data
    timestamp
  }
}
```

---

#### 🔍 `graphQuery`

Execute Cypher queries on graph database (Apache AGE).

**Arguments:**
- `cypher: String!` — Cypher query
- `params: [String]` — Query parameters (optional)

**Returns:**
```graphql
type GraphQueryResult {
  nodes: [GraphNode]
  edges: [GraphEdge]
}
```

**Example:**
```graphql
query GetUserNetwork {
  graphQuery(cypher: "MATCH (u:User)-[:FOLLOWS]->(f:User) RETURN u, f") {
    nodes {
      id
      label
      properties
    }
    edges {
      from
      to
      type
    }
  }
}
```

---

#### 🔍 `health`

Check API health and database connectivity.

**Returns:**
```graphql
type HealthStatus {
  status: String!
  timestamp: String!
  databases: DatabaseStatus!
}
```

**Example:**
```graphql
query HealthCheck {
  health {
    status
    databases {
      sql
      vector
      blockchain
      graph
    }
  }
}
```

---

### Mutations

#### ✏️ `executeSql`

Execute SQL INSERT/UPDATE/DELETE queries.

**Arguments:**
- `query: String!` — SQL mutation query
- `params: [String]` — Query parameters (optional)

**Returns:**
```graphql
type SQLResult {
  success: Boolean!
  data: String
  rowCount: Int
  error: String
}
```

**Example:**
```graphql
mutation CreateUser {
  executeSql(
    query: "INSERT INTO users (name, email) VALUES ($1, $2)"
    params: ["Alice", "alice@example.com"]
  ) {
    success
    rowCount
  }
}
```

---

#### ✏️ `insertVector`

Insert vector embedding into vector database.

**Arguments:**
- `embedding: [Float]!` — Vector to insert
- `metadata: String` — JSON metadata (optional)

**Returns:**
```graphql
type VectorInsertResult {
  success: Boolean!
  id: String
  error: String
}
```

**Example:**
```graphql
mutation AddEmbedding {
  insertVector(
    embedding: [0.1, 0.2, 0.3]
    metadata: "{\"doc\":\"AI Guide\",\"category\":\"tech\"}"
  ) {
    success
    id
  }
}
```

---

#### ✏️ `storeAttestation`

Store immutable attestation on blockchain.

**Arguments:**
- `data: String!` — JSON data to attest

**Returns:**
```graphql
type Attestation {
  id: String!
  hash: String!
  timestamp: String!
}
```

**Example:**
```graphql
mutation AttestProof {
  storeAttestation(data: "{\"proof\":\"verified\",\"timestamp\":1234567890}") {
    id
    hash
    timestamp
  }
}
```

---

#### ✏️ `createGraphNode`

Create node in graph database.

**Arguments:**
- `label: String!` — Node label
- `properties: String!` — JSON properties

**Returns:**
```graphql
type GraphNode {
  id: String!
  label: String!
  properties: String
}
```

**Example:**
```graphql
mutation CreateUserNode {
  createGraphNode(
    label: "User"
    properties: "{\"name\":\"Alice\",\"role\":\"developer\"}"
  ) {
    id
    label
    properties
  }
}
```

---

## 📋 Cheat Sheet

### Common Operations

| **Operation** | **Type** | **Use Case** | **Example** |
|---------------|----------|--------------|-------------|
| `sqlQuery` | Query | Read from PostgreSQL | `sqlQuery(query: "SELECT * FROM users")` |
| `executeSql` | Mutation | Write to PostgreSQL | `executeSql(query: "INSERT INTO users...")` |
| `vectorSearch` | Query | Find similar embeddings | `vectorSearch(embedding: [0.1, 0.2, 0.3])` |
| `insertVector` | Mutation | Store AI embeddings | `insertVector(embedding: [...], metadata: "...")` |
| `verifyAttestation` | Query | Verify blockchain proof | `verifyAttestation(id: "0xabc123")` |
| `storeAttestation` | Mutation | Create immutable record | `storeAttestation(data: "{...}")` |
| `graphQuery` | Query | Graph traversal | `graphQuery(cypher: "MATCH (u:User)...")` |
| `createGraphNode` | Mutation | Create graph node | `createGraphNode(label: "User", properties: "...")` |
| `health` | Query | Check API status | `health { status }` |

### Quick Examples

#### 🔹 Full-Text Search with SQL
```graphql
query Search {
  sqlQuery(
    query: "SELECT * FROM articles WHERE title ILIKE $1"
    params: ["%AI%"]
  ) {
    data
  }
}
```

#### 🔹 Semantic Search with Vectors
```graphql
query SemanticSearch {
  vectorSearch(
    embedding: [0.1, 0.2, 0.3]
    limit: 10
  ) {
    id
    similarity
    metadata
  }
}
```

#### 🔹 Graph Relationships
```graphql
query UserConnections {
  graphQuery(cypher: "MATCH (u:User {id: '123'})-[:FOLLOWS]->(f) RETURN f") {
    nodes { properties }
  }
}
```

#### 🔹 Blockchain Audit Trail
```graphql
mutation LogEvent {
  storeAttestation(data: "{\"event\":\"user_login\",\"userId\":\"123\"}") {
    id
    hash
  }
}
```

---

## 🔥 Advanced Usage

### Custom Context Per Request

```typescript
import { buildSchema, createContext } from '@symbiosedb/graphql-api';
import { graphql } from 'graphql';

const schema = buildSchema();

// Create custom context per request
app.post('/graphql', async (req, res) => {
  const context = createContext({
    ...connectors,
    userId: req.user.id, // Add request-specific data
  });

  const result = await graphql({
    schema,
    source: req.body.query,
    contextValue: context,
  });

  res.json(result);
});
```

### Error Handling

```typescript
const result = await graphql({ schema, source: query, contextValue: context });

if (result.errors) {
  console.error('GraphQL Errors:', result.errors);
  // Handle errors
}

console.log('Data:', result.data);
```

### Batch Queries

```graphql
query BatchOperations {
  users: sqlQuery(query: "SELECT * FROM users") { data }
  docs: vectorSearch(embedding: [0.1, 0.2, 0.3]) { id }
  health { status }
}
```

---

## 🎮 Interactive Playground

The GraphQL Playground provides:

✅ **Auto-completion** for queries and fields
✅ **Interactive schema explorer**
✅ **Query history**
✅ **Dark mode** (enabled by default)
✅ **Share queries** via URL

**Start Playground:**
```bash
npm run dev
# Visit http://localhost:4000/playground
```

**Keyboard Shortcuts:**
- `Ctrl/Cmd + Enter` — Execute query
- `Ctrl/Cmd + Space` — Auto-complete
- `Ctrl/Cmd + /` — Comment/uncomment
- `Prettify` button — Format query

---

## 🧪 Testing

### Run Tests

```bash
npm test              # Run all 18 tests
npm run test:watch    # Watch mode
```

### Test Coverage

| **Category** | **Tests** | **Status** |
|--------------|-----------|-----------|
| Schema Definition | 3 | ✅ Passing |
| SQL Operations | 4 | ✅ Passing |
| Vector Operations | 3 | ✅ Passing |
| Blockchain Operations | 3 | ✅ Passing |
| Graph Operations | 2 | ✅ Passing |
| Health Check | 1 | ✅ Passing |
| Error Handling | 2 | ✅ Passing |
| **Total** | **18** | **100%** |

### Writing Tests

```typescript
import { graphql } from 'graphql';
import { buildSchema, createContext } from '@symbiosedb/graphql-api';

const schema = buildSchema();
const context = createContext({
  sqlConnector: { query: jest.fn() },
  // ... other connectors
});

it('should execute SQL query', async () => {
  mockSqlQuery.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });

  const query = `query { sqlQuery(query: "SELECT * FROM users") { data } }`;
  const result = await graphql({ schema, source: query, contextValue: context });

  expect(result.errors).toBeUndefined();
  expect(result.data?.sqlQuery.data).toBeDefined();
});
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"

**Solution:** Ensure database connectors are properly initialized before starting server.

```typescript
// ✅ Good
const postgresClient = await createPostgresClient();
const connectors = {
  sqlConnector: { query: postgresClient.query },
  // ...
};

// ❌ Bad
const connectors = {
  sqlConnector: { query: null }, // Will fail
};
```

---

### Issue: "GraphQL Playground not loading"

**Solution:** Check that `enablePlayground: true` in server options.

```typescript
createServer({
  port: 4000,
  connectors,
  enablePlayground: true, // ← Ensure this is true
});
```

---

### Issue: "Type errors in TypeScript"

**Solution:** Ensure connectors match interface definitions.

```typescript
import type { SQLConnector, VectorConnector } from '@symbiosedb/graphql-api';

const sqlConnector: SQLConnector = {
  query: async (sql, params) => {
    // Must return { rows: any[], rowCount: number }
    return { rows: [], rowCount: 0 };
  },
};
```

---

### Issue: "Port already in use"

**Solution:** Change port or kill existing process.

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>

# Or use different port
createServer({ port: 5000, ... });
```

---

## 📦 Related Packages

- **[@symbiosedb/core](../core)** — Core database connectors
- **[@symbiosedb/dashboard](../dashboard-v2)** — Admin dashboard UI
- **[@symbiosedb/design-system](../design-system)** — Design system components

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/symbiosedb.git

# Install dependencies
npm install

# Run tests
npm test

# Start dev server
npm run dev
```

---

## 📄 License

MIT © SymbioseDB

---

## 🌟 Support

- **Issues:** [GitHub Issues](https://github.com/your-org/symbiosedb/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/symbiosedb/discussions)
- **Twitter:** [@symbiosedb](https://twitter.com/symbiosedb)

---

**Built with ❤️ by the SymbioseDB team using strict TDD (Test-Driven Development).**
