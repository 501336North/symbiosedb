import { Pool, PoolConfig } from 'pg';
import {
  VectorConfig,
  VectorConnector,
  VectorSearchOptions,
  VectorSearchResult,
} from './types';

/**
 * PostgreSQL pgvector connector for vector similarity search
 *
 * Uses the pgvector extension for PostgreSQL to store and search
 * high-dimensional vectors for AI/ML applications.
 */
export class PgVectorConnector implements VectorConnector {
  private pool: Pool | null = null;
  private config: VectorConfig;
  private connected: boolean = false;
  private collectionName: string;

  constructor(config: VectorConfig) {
    if (!config) {
      throw new Error('Vector database configuration required');
    }

    // DX Fix #2: Accept both 'url' and 'connectionString' (prefer 'url')
    const actualUrl = config.url || config.connectionString;

    if (!actualUrl || actualUrl.trim() === '') {
      throw new Error('Vector database URL or connectionString required');
    }

    // Normalize config to always use 'url' internally
    this.config = {
      ...config,
      url: actualUrl,
    };
    this.collectionName = config.collection || 'vectors';
  }

  /**
   * Connect to PostgreSQL and initialize pgvector
   */
  async connect(): Promise<void> {
    if (this.connected && this.pool) {
      return; // Already connected
    }

    const poolConfig: PoolConfig = {
      connectionString: this.config.url,
      max: 10,
      idleTimeoutMillis: 30000,
    };

    this.pool = new Pool(poolConfig);

    try {
      // Test connection
      const client = await this.pool.connect();
      client.release();

      // Initialize pgvector extension
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create collection table if it doesn't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.collectionName} (
          id TEXT PRIMARY KEY,
          embedding vector,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create index for faster similarity search
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS ${this.collectionName}_embedding_idx
        ON ${this.collectionName}
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);

      this.connected = true;
    } catch (error) {
      this.pool = null;
      this.connected = false;
      throw new Error(
        `Failed to connect to vector database: ${(error as Error).message}`
      );
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      this.connected = false;
      return;
    }

    try {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
    } catch (error) {
      throw new Error(
        `Failed to disconnect from vector database: ${(error as Error).message}`
      );
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.pool !== null;
  }

  /**
   * Search for similar vectors using cosine similarity
   */
  async search(
    embedding: number[],
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    if (!this.isConnected() || !this.pool) {
      throw new Error('Not connected to database');
    }

    const limit = options?.limit || 10;
    const filter = options?.filter;

    try {
      let query = `
        SELECT
          id,
          1 - (embedding <=> $1::vector) as similarity,
          metadata
        FROM ${this.collectionName}
      `;

      const params: any[] = [embedding, limit];

      // Add filter conditions if provided
      if (filter && Object.keys(filter).length > 0) {
        const conditions = Object.entries(filter).map(([key, value], idx) => {
          params.push(value);
          return `metadata->>'${key}' = $${idx + 3}`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += `
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;

      const result = await this.pool.query(query, params);

      return result.rows.map((row) => ({
        id: row.id,
        score: parseFloat(row.similarity),
        metadata: row.metadata || undefined,
      }));
    } catch (error) {
      throw new Error(
        `Vector search failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Insert a vector with optional metadata
   */
  async insert(
    id: string,
    embedding: number[],
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isConnected() || !this.pool) {
      throw new Error('Not connected to database');
    }

    try {
      const query = `
        INSERT INTO ${this.collectionName} (id, embedding, metadata)
        VALUES ($1, $2::vector, $3)
        ON CONFLICT (id) DO UPDATE
        SET embedding = $2::vector, metadata = $3
      `;

      await this.pool.query(query, [
        id,
        embedding,
        metadata ? JSON.stringify(metadata) : null,
      ]);
    } catch (error) {
      throw new Error(
        `Vector insertion failed: ${(error as Error).message}`
      );
    }
  }
}
