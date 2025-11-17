import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SymbioseDB API',
    version: '0.1.0',
    description: `
# SymbioseDB API Documentation

The intelligent data infrastructure API combining PostgreSQL, Vector Search, Graph Queries, and Blockchain.

## Features
- **SQL Queries**: Execute PostgreSQL queries with full ACID compliance
- **Graph Queries**: Cypher-like graph traversal with Apache AGE
- **Vector Search**: AI/ML embeddings with pgvector similarity search
- **Blockchain**: Immutable attestations on Ethereum L2

## Authentication
SymbioseDB API supports two authentication methods:
1. **JWT Bearer Tokens**: For user-based authentication
2. **API Keys**: For service-to-service authentication

Provide authentication via:
- Bearer token: \`Authorization: Bearer <token>\`
- API key: \`X-API-Key: <key>\`

## Rate Limiting
- General endpoints: 100 requests per 15 minutes
- Query endpoints: 50 requests per 15 minutes
- Blockchain endpoints: 10 requests per hour
    `,
    contact: {
      name: 'SymbioseDB API Support',
      url: 'https://symbiosedb.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.symbiosedb.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from authentication',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service authentication',
      },
    },
    schemas: {
      QueryRequest: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'SQL or Graph query to execute',
            example: 'SELECT * FROM users LIMIT 10',
          },
          params: {
            type: 'array',
            description: 'Query parameters for parameterized queries',
            items: {},
            example: [1, 'john@example.com'],
          },
        },
      },
      QueryResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              rows: {
                type: 'array',
                items: {},
              },
              rowCount: {
                type: 'number',
              },
            },
          },
        },
      },
      VectorSearchRequest: {
        type: 'object',
        required: ['embedding'],
        properties: {
          embedding: {
            type: 'array',
            items: {
              type: 'number',
            },
            description: 'Vector embedding to search for',
            example: [0.1, 0.2, 0.3, 0.4],
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results',
            example: 10,
          },
          filter: {
            type: 'object',
            description: 'Metadata filters',
            additionalProperties: true,
          },
        },
      },
      VectorSearchResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                score: {
                  type: 'number',
                  description: 'Similarity score (0-1)',
                },
                metadata: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
      AttestationStoreRequest: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            description: 'Data to store in attestation',
            additionalProperties: true,
          },
        },
      },
      AttestationStoreResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              attestationId: {
                type: 'string',
                description: 'Unique identifier for the attestation',
              },
            },
          },
        },
      },
      AttestationVerifyResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              valid: {
                type: 'boolean',
                description: 'Whether the attestation is valid',
              },
              data: {
                type: 'object',
                description: 'Original attestation data',
              },
              timestamp: {
                type: 'string',
                description: 'When the attestation was created',
              },
            },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy', 'degraded'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          uptime: {
            type: 'number',
            description: 'Service uptime in seconds',
          },
          version: {
            type: 'string',
          },
          components: {
            type: 'object',
            properties: {
              api: {
                type: 'string',
                enum: ['healthy', 'unhealthy'],
              },
              database: {
                type: 'string',
                enum: ['healthy', 'unhealthy', 'unknown'],
              },
              vector: {
                type: 'string',
                enum: ['healthy', 'unhealthy', 'unknown'],
              },
              blockchain: {
                type: 'string',
                enum: ['healthy', 'unhealthy', 'unknown'],
              },
            },
          },
          metrics: {
            type: 'object',
            properties: {
              totalRequests: {
                type: 'number',
              },
              totalQueries: {
                type: 'number',
              },
              averageResponseTime: {
                type: 'number',
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          message: {
            type: 'string',
            description: 'Additional error details',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check and monitoring endpoints',
    },
    {
      name: 'Monitoring',
      description: 'Prometheus metrics and observability',
    },
    {
      name: 'Documentation',
      description: 'API documentation endpoints',
    },
    {
      name: 'Queries',
      description: 'SQL and Graph query execution',
    },
    {
      name: 'Vector',
      description: 'Vector similarity search operations',
    },
    {
      name: 'Blockchain',
      description: 'Blockchain attestation operations',
    },
  ],
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: ['./src/**/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJSDoc(options);
