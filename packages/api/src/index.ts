import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Executor, QueryRouter, PostgreSQLConnector, PgVectorConnector, EthereumConnector, DatabaseConfig } from '@symbiosedb/core';
import { authenticate, optionalAuth } from './auth';
import {
  queryLimiter,
  blockchainLimiter,
  validateInput,
  securityHeaders,
  helmetConfig,
  corsOptions
} from './security';

/**
 * SymbioseDB REST API Server
 *
 * Provides a secure, rate-limited REST API for SymbioseDB operations.
 *
 * Security Features:
 * - JWT and API key authentication
 * - SQL/NoSQL injection protection
 * - Rate limiting per endpoint
 * - Helmet security headers
 * - CORS protection
 *
 * Middleware Chain Order:
 * 1. Security headers (helmet, custom headers)
 * 2. CORS
 * 3. Body parsing
 * 4. Authentication (per-route)
 * 5. Rate limiting (per-route)
 * 6. Input validation (per-route)
 * 7. Route handler
 */
export class SymbioseDBAPI {
  private app: Express;
  private executor: Executor | null = null;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup global middleware
   * Note: Auth, rate limiting, and validation are applied per-route
   */
  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmetConfig);
    this.app.use(securityHeaders);

    // CORS and body parsing - Use hardened configuration
    this.app.use(cors(corsOptions));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  async initialize(config: DatabaseConfig): Promise<void> {
    const router = new QueryRouter(config);
    const pgConnector = new PostgreSQLConnector(config.postgresql);
    const vectorConnector = config.vector ? new PgVectorConnector(config.vector) : undefined;
    const blockchainConnector = config.blockchain ? new EthereumConnector(config.blockchain) : undefined;

    this.executor = new Executor(router, {
      postgresql: pgConnector,
      vector: vectorConnector,
      blockchain: blockchainConnector,
    });

    await this.executor.connect();
  }

  /**
   * Setup API routes with security middleware
   *
   * Middleware order per route:
   * 1. authenticate - Validates JWT or API key
   * 2. queryLimiter/blockchainLimiter - Rate limiting
   * 3. validateInput - SQL/NoSQL injection protection
   * 4. Handler - Business logic
   */
  private setupRoutes(): void {
    // Health check (no auth required)
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'SymbioseDB API', version: '0.1.0' });
    });

    /**
     * POST /query
     * Execute a database query
     * Auth: Required (JWT or API key)
     * Rate Limit: 50 requests per 15 minutes
     */
    this.app.post('/query', authenticate, queryLimiter, validateInput, async (req: Request, res: Response) => {
      try {
        if (!this.executor) {
          return res.status(503).json({ error: 'Service not initialized' });
        }

        const { query, params } = req.body;
        if (!query) {
          return res.status(400).json({ error: 'Query required' });
        }

        const result = await this.executor.execute(query, params);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    /**
     * POST /vector/search
     * Search vector database for similar embeddings
     * Auth: Required (JWT or API key)
     * Rate Limit: 50 requests per 15 minutes
     */
    this.app.post('/vector/search', authenticate, validateInput, queryLimiter, async (req: Request, res: Response) => {
      try {
        if (!this.executor) {
          return res.status(503).json({ error: 'Service not initialized' });
        }

        const { embedding, limit, filter } = req.body;
        if (!embedding || !Array.isArray(embedding)) {
          return res.status(400).json({ error: 'Valid embedding array required' });
        }

        const result = await this.executor.execute({
          type: 'vector_search',
          embedding,
          limit,
          filter,
        });

        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    /**
     * POST /attestation/store
     * Store a verifiable attestation on blockchain
     * Auth: Required (JWT or API key)
     * Rate Limit: 10 requests per hour
     */
    this.app.post('/attestation/store', authenticate, validateInput, blockchainLimiter, async (req: Request, res: Response) => {
      try {
        if (!this.executor) {
          return res.status(503).json({ error: 'Service not initialized' });
        }

        const { data } = req.body;
        if (!data) {
          return res.status(400).json({ error: 'Data required' });
        }

        const result = await this.executor.execute({
          type: 'store_attestation',
          data,
        });

        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    /**
     * GET /attestation/:id
     * Retrieve and verify an attestation
     * Auth: Required (JWT or API key)
     */
    this.app.get('/attestation/:id', authenticate, async (req: Request, res: Response) => {
      try {
        if (!this.executor) {
          return res.status(503).json({ error: 'Service not initialized' });
        }

        const { id } = req.params;
        const result = await this.executor.execute({
          type: 'verify_attestation',
          attestationId: id,
        });

        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`SymbioseDB API listening on port ${this.port}`);
        resolve();
      });
    });
  }

  getApp(): Express {
    return this.app;
  }
}

export default SymbioseDBAPI;
