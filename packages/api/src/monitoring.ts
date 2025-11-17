import { Request, Response, NextFunction } from 'express';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import winston from 'winston';

// Prometheus Registry
export const register = new Registry();

// Metrics
export const httpRequestsTotal = new Counter({
  name: 'symbiosedb_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'symbiosedb_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'symbiosedb_active_connections',
  help: 'Number of active database connections',
  registers: [register],
});

export const queryExecutionTime = new Histogram({
  name: 'symbiosedb_query_execution_seconds',
  help: 'Query execution time in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const queriesTotal = new Counter({
  name: 'symbiosedb_queries_total',
  help: 'Total number of queries executed',
  labelNames: ['query_type', 'status'],
  registers: [register],
});

// Winston Logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'symbiosedb-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * Prometheus Metrics Middleware
 * Tracks HTTP requests and duration
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });

  next();
};

/**
 * Request Logging Middleware
 * Logs all HTTP requests with details
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info({
      type: 'http_request',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};

/**
 * Error Logging Middleware
 * Logs errors with stack traces
 */
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error({
    type: 'error',
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  next(err);
};

/**
 * Track Query Execution
 * Helper function to track query metrics
 */
export const trackQuery = async <T>(
  queryType: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();

  try {
    const result = await queryFn();
    const duration = (Date.now() - start) / 1000;

    queryExecutionTime.observe({ query_type: queryType }, duration);
    queriesTotal.inc({ query_type: queryType, status: 'success' });

    logger.debug({
      type: 'query_execution',
      queryType,
      duration,
      status: 'success',
    });

    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;

    queryExecutionTime.observe({ query_type: queryType }, duration);
    queriesTotal.inc({ query_type: queryType, status: 'error' });

    logger.error({
      type: 'query_execution',
      queryType,
      duration,
      status: 'error',
      error: (error as Error).message,
    });

    throw error;
  }
};

/**
 * Health Check Function
 * Returns detailed health status
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  components: {
    api: 'healthy' | 'unhealthy';
    database: 'healthy' | 'unhealthy' | 'unknown';
    vector: 'healthy' | 'unhealthy' | 'unknown';
    blockchain: 'healthy' | 'unhealthy' | 'unknown';
  };
  metrics: {
    totalRequests: number;
    totalQueries: number;
    averageResponseTime: number;
  };
}

const startTime = Date.now();

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const metrics = await register.getMetricsAsJSON();

  // Extract metrics values
  let totalRequests = 0;
  let totalQueries = 0;

  for (const metric of metrics) {
    if (metric.name === 'symbiosedb_http_requests_total') {
      totalRequests = (metric as any).values?.reduce(
        (sum: number, v: any) => sum + v.value,
        0
      ) || 0;
    }
    if (metric.name === 'symbiosedb_queries_total') {
      totalQueries = (metric as any).values?.reduce(
        (sum: number, v: any) => sum + v.value,
        0
      ) || 0;
    }
  }

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '0.1.0',
    components: {
      api: 'healthy',
      database: 'unknown', // Would check actual connection
      vector: 'unknown',
      blockchain: 'unknown',
    },
    metrics: {
      totalRequests,
      totalQueries,
      averageResponseTime: 0, // Calculate from histogram
    },
  };
};
