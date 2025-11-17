import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import {
  Executor,
  QueryRouter,
  PostgreSQLConnector,
  PgVectorConnector,
  EthereumConnector,
  DatabaseConfig,
} from '@symbiosedb/core';

// Import Phase 4 features
import { optionalAuth, requirePermission, AuthRequest } from './auth';
import {
  register,
  metricsMiddleware,
  requestLogger,
  errorLogger,
  trackQuery,
  getHealthStatus,
  logger,
} from './monitoring';
import {
  generalLimiter,
  queryLimiter,
  blockchainLimiter,
  helmetConfig,
  securityHeaders,
  corsOptions,
} from './security';
import { swaggerSpec } from './swagger';
import { addToWaitlist } from './waitlist';

// Quality Audit Fix: Pagination constants
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 10000;

/**
 * SymbioseDB API Server with Production Features
 *
 * Phase 4 Features:
 * - JWT & API Key Authentication
 * - Rate Limiting
 * - Prometheus Metrics
 * - Winston Logging
 * - Swagger Documentation
 * - Security Headers
 *
 * Quality Audit Fixes:
 * - Query Pagination (prevents 5MB+ responses)
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
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Compression (before other middleware to compress all responses)
    this.app.use(compression({
      // Only compress responses larger than 1KB
      threshold: 1024,
      // Compression level (0-9, where 9 is maximum compression)
      level: 6,
      // Filter: only compress JSON and text responses
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }));

    // Security
    this.app.use(helmetConfig);
    this.app.use(securityHeaders);

    // CORS - Use hardened configuration
    this.app.use(cors(corsOptions));

    // Body parsing
    this.app.use(bodyParser.json({ limit: '10mb' }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

    // Monitoring
    this.app.use(metricsMiddleware);
    this.app.use(requestLogger);

    // Optional authentication (doesn't block unauthenticated requests)
    this.app.use(optionalAuth);
  }

  async initialize(config: DatabaseConfig): Promise<void> {
    logger.info('Initializing SymbioseDB API...');

    const router = new QueryRouter(config);
    const pgConnector = new PostgreSQLConnector(config.postgresql);
    const vectorConnector = config.vector
      ? new PgVectorConnector(config.vector)
      : undefined;
    const blockchainConnector = config.blockchain
      ? new EthereumConnector(config.blockchain)
      : undefined;

    this.executor = new Executor(router, {
      postgresql: pgConnector,
      vector: vectorConnector,
      blockchain: blockchainConnector,
    });

    await this.executor.connect();
    logger.info('SymbioseDB API initialized successfully');
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service health status
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthResponse'
     */
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const health = await getHealthStatus();
        res.json(health);
      } catch (error) {
        res.status(500).json({ error: 'Health check failed' });
      }
    });

    /**
     * @swagger
     * /metrics:
     *   get:
     *     summary: Prometheus metrics endpoint
     *     tags: [Monitoring]
     *     responses:
     *       200:
     *         description: Prometheus metrics in text format
     */
    this.app.get('/metrics', async (req: Request, res: Response) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    /**
     * @swagger
     * /docs:
     *   get:
     *     summary: API Documentation (Swagger UI)
     *     tags: [Documentation]
     *     responses:
     *       200:
     *         description: Swagger UI interface
     */
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    /**
     * @swagger
     * /api-spec:
     *   get:
     *     summary: OpenAPI specification (JSON)
     *     tags: [Documentation]
     *     responses:
     *       200:
     *         description: OpenAPI spec in JSON format
     */
    this.app.get('/api-spec', (req: Request, res: Response) => {
      res.json(swaggerSpec);
    });

    /**
     * @swagger
     * /query:
     *   post:
     *     summary: Execute SQL or Graph query
     *     tags: [Queries]
     *     security:
     *       - bearerAuth: []
     *       - apiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/QueryRequest'
     *     responses:
     *       200:
     *         description: Query executed successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/QueryResponse'
     *       400:
     *         description: Invalid query
     *       503:
     *         description: Service not initialized
     */
    this.app.post(
      '/query',
      queryLimiter,
      async (req: Request, res: Response) => {
        try {
          if (!this.executor) {
            return res.status(503).json({ error: 'Service not initialized' });
          }

          const { query, params, pagination } = req.body;
          if (!query) {
            return res.status(400).json({ error: 'Query required' });
          }

          // Quality Audit Fix: Parse pagination parameters
          const limit = Math.min(
            pagination?.limit || DEFAULT_LIMIT,
            MAX_LIMIT
          );
          const offset = pagination?.offset || 0;

          // Quality Audit Fix: Add pagination to query if not present
          const paginatedQuery = this.addPaginationToQuery(query, limit, offset);

          const result = await trackQuery('sql', () =>
            this.executor!.execute(paginatedQuery, params)
          );

          // Quality Audit Fix: Add pagination metadata to response
          const rows = (result as any).rows || [];
          res.json({
            success: true,
            data: result,
            pagination: {
              limit,
              offset,
              returned: rows.length,
              hasMore: rows.length === limit,
            },
          });
        } catch (error) {
          logger.error('Query execution failed', { error });
          res.status(500).json({ error: (error as Error).message });
        }
      }
    );

    /**
     * @swagger
     * /vector/search:
     *   post:
     *     summary: Perform vector similarity search
     *     tags: [Vector]
     *     security:
     *       - bearerAuth: []
     *       - apiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/VectorSearchRequest'
     *     responses:
     *       200:
     *         description: Search completed successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/VectorSearchResponse'
     */
    this.app.post(
      '/vector/search',
      queryLimiter,
      async (req: Request, res: Response) => {
        try {
          if (!this.executor) {
            return res.status(503).json({ error: 'Service not initialized' });
          }

          const { embedding, limit, filter } = req.body;
          if (!embedding || !Array.isArray(embedding)) {
            return res
              .status(400)
              .json({ error: 'Valid embedding array required' });
          }

          const result = await trackQuery('vector', () =>
            this.executor!.execute({
              type: 'vector_search',
              embedding,
              limit,
              filter,
            })
          );

          res.json({ success: true, data: result });
        } catch (error) {
          logger.error('Vector search failed', { error });
          res.status(500).json({ error: (error as Error).message });
        }
      }
    );

    /**
     * @swagger
     * /attestation/store:
     *   post:
     *     summary: Store attestation on blockchain
     *     tags: [Blockchain]
     *     security:
     *       - bearerAuth: []
     *       - apiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AttestationStoreRequest'
     *     responses:
     *       200:
     *         description: Attestation stored successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AttestationStoreResponse'
     */
    this.app.post(
      '/attestation/store',
      blockchainLimiter,
      async (req: Request, res: Response) => {
        try {
          if (!this.executor) {
            return res.status(503).json({ error: 'Service not initialized' });
          }

          const { data } = req.body;
          if (!data) {
            return res.status(400).json({ error: 'Data required' });
          }

          const result = await trackQuery('blockchain_store', () =>
            this.executor!.execute({
              type: 'store_attestation',
              data,
            })
          );

          res.json({ success: true, data: result });
        } catch (error) {
          logger.error('Attestation storage failed', { error });
          res.status(500).json({ error: (error as Error).message });
        }
      }
    );

    /**
     * @swagger
     * /attestation/{id}:
     *   get:
     *     summary: Verify attestation from blockchain
     *     tags: [Blockchain]
     *     security:
     *       - bearerAuth: []
     *       - apiKeyAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Attestation ID
     *     responses:
     *       200:
     *         description: Attestation verification result
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AttestationVerifyResponse'
     */
    this.app.get(
      '/attestation/:id',
      generalLimiter,
      async (req: Request, res: Response) => {
        try {
          if (!this.executor) {
            return res.status(503).json({ error: 'Service not initialized' });
          }

          const { id } = req.params;
          const result = await trackQuery('blockchain_verify', () =>
            this.executor!.execute({
              type: 'verify_attestation',
              attestationId: id,
            })
          );

          res.json({ success: true, data: result });
        } catch (error) {
          logger.error('Attestation verification failed', { error });
          res.status(500).json({ error: (error as Error).message });
        }
      }
    );

    /**
     * @swagger
     * /api/waitlist:
     *   post:
     *     summary: Add email to waitlist
     *     tags: [Waitlist]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *     responses:
     *       201:
     *         description: Successfully added to waitlist
     *       400:
     *         description: Invalid email format
     *       409:
     *         description: Email already on waitlist
     */
    this.app.post(
      '/api/waitlist',
      generalLimiter,
      addToWaitlist
    );

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorLogger);

    this.app.use(
      (
        err: Error,
        req: Request,
        res: Response,
        next: Function
      ) => {
        res.status(500).json({
          error: 'Internal server error',
          message:
            process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
      }
    );
  }

  /**
   * Quality Audit Fix: Add pagination to query if not already present
   */
  private addPaginationToQuery(query: string, limit: number, offset: number): string {
    const upperQuery = query.trim().toUpperCase();

    // Check if LIMIT already exists
    if (upperQuery.includes('LIMIT')) {
      return query; // Don't modify if already paginated
    }

    // Add LIMIT and OFFSET
    return `${query.trim()} LIMIT ${limit} OFFSET ${offset}`;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        logger.info(`SymbioseDB API listening on port ${this.port}`);
        logger.info(`Swagger docs available at http://localhost:${this.port}/docs`);
        logger.info(`Metrics available at http://localhost:${this.port}/metrics`);
        resolve();
      });
    });
  }

  getApp(): Express {
    return this.app;
  }
}

export default SymbioseDBAPI;
