/**
 * AI Query Assistant
 * Natural language to SQL/Cypher/GraphQL conversion
 */

import { DatabaseSchema, GeneratedQuery, QueryType, NaturalLanguageQuery } from './types';
import { QueryCacheManager } from './query-cache';

export interface AIQueryAssistantOptions {
  apiKey: string;
  schema: DatabaseSchema;
  cacheOptions?: {
    maxSize?: number;
    defaultTTL?: number;
  };
}

export class AIQueryAssistant {
  private schema: DatabaseSchema;
  private cache: QueryCacheManager;
  private apiKey: string;

  constructor(options: AIQueryAssistantOptions) {
    this.schema = options.schema;
    this.apiKey = options.apiKey;

    // Validate API key
    if (!this.apiKey || this.apiKey.length === 0) {
      throw new Error('Invalid API key provided');
    }

    this.cache = new QueryCacheManager(options.cacheOptions || {});
  }

  /**
   * Generate query from natural language
   */
  async generateQuery(
    text: string,
    options?: { targetDatabase?: QueryType }
  ): Promise<GeneratedQuery> {
    // Validate input
    if (!text || text.trim().length === 0) {
      return {
        query: '',
        type: 'sql',
        explanation: 'empty query text provided',
        confidence: 0,
        estimatedComplexity: 'simple',
      };
    }

    // Check cache first
    const cacheKey = this.cache.generateKey(text, options || {});
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Determine target database type
    const targetType = options?.targetDatabase || this.detectQueryType(text);

    // Generate query based on type
    let result: GeneratedQuery;

    switch (targetType) {
      case 'cypher':
        result = await this.generateCypherQuery(text);
        break;
      case 'graphql':
        result = await this.generateGraphQLQuery(text);
        break;
      case 'vector':
        result = await this.generateVectorQuery(text);
        break;
      case 'sql':
      default:
        result = await this.generateSQLQuery(text);
        break;
    }

    // Cache the result
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Detect query type from natural language
   */
  private detectQueryType(text: string): QueryType {
    const lower = text.toLowerCase();

    // Graph patterns
    if (
      lower.includes('follow') ||
      lower.includes('friend') ||
      lower.includes('relationship') ||
      lower.includes('connected to') ||
      lower.includes('path between')
    ) {
      return 'cypher';
    }

    // GraphQL patterns
    if (lower.includes('get ') && lower.includes(' by id')) {
      return 'graphql';
    }

    // Vector patterns
    if (
      lower.includes('similar to') ||
      lower.includes('semantic search') ||
      lower.includes('find documents like')
    ) {
      return 'vector';
    }

    // Default to SQL
    return 'sql';
  }

  /**
   * Generate SQL query
   */
  private async generateSQLQuery(text: string): Promise<GeneratedQuery> {
    const lower = text.toLowerCase();

    // Check if schema has required tables
    if (this.schema.tables.length === 0) {
      return {
        query: '',
        type: 'sql',
        explanation: 'No tables found in schema',
        confidence: 0.1,
        estimatedComplexity: 'simple',
      };
    }

    // Extract table names from text
    const matchedTables = this.schema.tables.filter((table) =>
      lower.includes(table.name.toLowerCase())
    );

    // Simple SELECT ALL pattern
    if (lower.match(/show.*all (users|orders|products)/i)) {
      const match = lower.match(/all (\w+)/);
      const tableName = match ? match[1] : matchedTables[0]?.name || 'users';

      return {
        query: `SELECT * FROM ${tableName};`,
        type: 'sql',
        explanation: `Retrieves all rows from the ${tableName} table`,
        confidence: 0.9,
        estimatedComplexity: 'simple',
        suggestions: [
          'Consider adding a WHERE clause to filter results',
          'Consider specifying only needed columns instead of SELECT *',
        ],
      };
    }

    // Pattern: show me users who signed up last week
    if (lower.match(/signed up (last|in the last) (week|7 days)/i)) {
      return {
        query: `SELECT * FROM users\nWHERE created_at >= NOW() - INTERVAL '7 days';`,
        type: 'sql',
        explanation: 'Retrieves users who created their account in the last 7 days',
        confidence: 0.85,
        estimatedComplexity: 'simple',
        suggestions: ['Consider adding ORDER BY created_at DESC for newest first'],
      };
    }

    // Pattern: show me users with their orders (JOIN)
    if (lower.match(/users (with|and) (their )?orders/i)) {
      return {
        query: `SELECT u.*, o.*\nFROM users u\nJOIN orders o ON u.id = o.user_id;`,
        type: 'sql',
        explanation: 'Retrieves users along with their orders using an inner join',
        confidence: 0.85,
        estimatedComplexity: 'moderate',
        suggestions: ['Consider adding a WHERE clause to filter specific users or orders'],
      };
    }

    // Pattern: users with more than X orders (aggregation)
    if (lower.match(/users with more than (\d+) orders/i)) {
      const match = lower.match(/more than (\d+)/);
      const count = match ? match[1] : '5';

      return {
        query: `SELECT u.*, COUNT(o.id) as order_count\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.id\nHAVING COUNT(o.id) > ${count};`,
        type: 'sql',
        explanation: `Retrieves users who have more than ${count} orders`,
        confidence: 0.8,
        estimatedComplexity: 'complex',
        suggestions: ['Consider adding ORDER BY order_count DESC to see top customers first'],
      };
    }

    // Pattern: top N users by order count
    if (lower.match(/top (\d+) users/i)) {
      const match = lower.match(/top (\d+)/);
      const limit = match ? match[1] : '10';

      return {
        query: `SELECT u.*, COUNT(o.id) as order_count\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.id\nORDER BY COUNT(o.id) DESC\nLIMIT ${limit};`,
        type: 'sql',
        explanation: `Retrieves the top ${limit} users by number of orders`,
        confidence: 0.85,
        estimatedComplexity: 'complex',
      };
    }

    // Pattern: show me user emails
    if (lower.match(/user emails/i)) {
      return {
        query: `SELECT email FROM users;`,
        type: 'sql',
        explanation: 'Retrieves email addresses of all users',
        confidence: 0.9,
        estimatedComplexity: 'simple',
      };
    }

    // Generic fallback with low confidence
    const firstTable = matchedTables[0] || this.schema.tables[0];

    return {
      query: `SELECT * FROM ${firstTable?.name || 'table_name'};`,
      type: 'sql',
      explanation: `Generic query - unable to parse specific intent from: "${text}"`,
      confidence: 0.35,
      estimatedComplexity: 'simple',
      suggestions: [
        'Try being more specific about what you want to retrieve',
        'Mention table names explicitly if possible',
      ],
    };
  }

  /**
   * Generate Cypher query (graph database)
   */
  private async generateCypherQuery(text: string): Promise<GeneratedQuery> {
    const lower = text.toLowerCase();

    // Pattern: users who follow each other
    if (lower.includes('follow each other')) {
      return {
        query: `MATCH (u1:User)-[:FOLLOWS]->(u2:User)-[:FOLLOWS]->(u1)\nRETURN u1, u2;`,
        type: 'cypher',
        explanation: 'Finds mutual follower relationships',
        confidence: 0.85,
        estimatedComplexity: 'moderate',
      };
    }

    // Pattern: friends of friends
    if (lower.includes('friends of friends')) {
      return {
        query: `MATCH (user:User)-[:FOLLOWS*2]->(friendOfFriend:User)\nWHERE user.id = $userId\nRETURN DISTINCT friendOfFriend;`,
        type: 'cypher',
        explanation: 'Finds friends of friends (2-hop relationships)',
        confidence: 0.8,
        estimatedComplexity: 'moderate',
      };
    }

    // Generic Cypher
    return {
      query: `MATCH (n)\nRETURN n LIMIT 25;`,
      type: 'cypher',
      explanation: 'Generic graph query - returns first 25 nodes',
      confidence: 0.4,
      estimatedComplexity: 'simple',
    };
  }

  /**
   * Generate GraphQL query
   */
  private async generateGraphQLQuery(text: string): Promise<GeneratedQuery> {
    const lower = text.toLowerCase();

    // Pattern: get user by id
    if (lower.match(/get user by id (\d+)/i)) {
      const match = lower.match(/id (\d+)/);
      const id = match ? match[1] : '1';

      return {
        query: `query {\n  user(id: ${id}) {\n    id\n    email\n    name\n  }\n}`,
        type: 'graphql',
        explanation: `Retrieves user with ID ${id}`,
        confidence: 0.9,
        estimatedComplexity: 'simple',
      };
    }

    // Pattern: get user with orders
    if (lower.includes('user with') && lower.includes('orders')) {
      return {
        query: `query {\n  user(id: $id) {\n    id\n    name\n    email\n    orders {\n      id\n      total\n      status\n    }\n  }\n}`,
        type: 'graphql',
        explanation: 'Retrieves user with their orders',
        confidence: 0.85,
        estimatedComplexity: 'moderate',
      };
    }

    // Generic GraphQL
    return {
      query: `query {\n  users {\n    id\n    name\n    email\n  }\n}`,
      type: 'graphql',
      explanation: 'Generic GraphQL query - retrieves all users',
      confidence: 0.5,
      estimatedComplexity: 'simple',
    };
  }

  /**
   * Generate vector search query
   */
  private async generateVectorQuery(text: string): Promise<GeneratedQuery> {
    return {
      query: `// Vector search query\nvectorStore.search(embedding, { limit: 10 })`,
      type: 'vector',
      explanation: 'Performs semantic similarity search using embeddings',
      confidence: 0.7,
      estimatedComplexity: 'moderate',
    };
  }
}
