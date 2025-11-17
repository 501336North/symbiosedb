/**
 * OpenTelemetry Tracing Configuration
 *
 * Distributed tracing for SymbioseDB API using OpenTelemetry.
 * Supports Jaeger and Tempo exporters.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { trace, SpanStatusCode, context } from '@opentelemetry/api';

export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  environment: string;
  exporter: 'jaeger' | 'otlp' | 'console';
  jaegerEndpoint?: string;
  otlpEndpoint?: string;
  sampleRate?: number;
}

export class TracingService {
  private sdk?: NodeSDK;
  private config: TracingConfig;

  constructor(config: TracingConfig) {
    this.config = {
      sampleRate: 1.0,
      jaegerEndpoint: 'http://localhost:14268/api/traces',
      otlpEndpoint: 'http://localhost:4318/v1/traces',
      ...config,
    };
  }

  /**
   * Initialize OpenTelemetry SDK
   */
  public initialize(): void {
    if (!this.config.enabled) {
      console.log('Tracing is disabled');
      return;
    }

    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '0.1.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
    });

    // Choose exporter based on configuration
    const exporter = this.createExporter();

    this.sdk = new NodeSDK({
      resource,
      spanProcessor: new BatchSpanProcessor(exporter, {
        maxQueueSize: 2048,
        scheduledDelayMillis: 5000,
        exportTimeoutMillis: 30000,
        maxExportBatchSize: 512,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          // Auto-instrument Express, HTTP, PostgreSQL, Redis, etc.
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-http': { enabled: true },
          '@opentelemetry/instrumentation-express': { enabled: true },
          '@opentelemetry/instrumentation-pg': { enabled: true },
          '@opentelemetry/instrumentation-redis': { enabled: true },
        }),
      ],
    });

    this.sdk.start();
    console.log(`Tracing initialized with ${this.config.exporter} exporter`);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      this.shutdown();
    });
  }

  /**
   * Create trace exporter based on configuration
   */
  private createExporter() {
    switch (this.config.exporter) {
      case 'jaeger':
        return new JaegerExporter({
          endpoint: this.config.jaegerEndpoint,
        });

      case 'otlp':
        return new OTLPTraceExporter({
          url: this.config.otlpEndpoint,
        });

      case 'console':
        return new ConsoleSpanExporter();

      default:
        throw new Error(`Unknown exporter: ${this.config.exporter}`);
    }
  }

  /**
   * Create a custom span
   */
  public createSpan(name: string, fn: (span: any) => Promise<any>) {
    const tracer = trace.getTracer(this.config.serviceName);

    return tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error: any) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Add custom attributes to current span
   */
  public addAttributes(attributes: Record<string, string | number | boolean>) {
    const span = trace.getActiveSpan();
    if (span) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }
  }

  /**
   * Add event to current span
   */
  public addEvent(name: string, attributes?: Record<string, any>) {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Shutdown tracing gracefully
   */
  public async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
      console.log('Tracing shutdown complete');
    }
  }
}

/**
 * Express middleware for tracing HTTP requests
 */
export function tracingMiddleware(tracingService: TracingService) {
  return (req: any, res: any, next: any) => {
    const span = trace.getActiveSpan();

    if (span) {
      // Add HTTP request attributes
      span.setAttributes({
        'http.method': req.method,
        'http.url': req.url,
        'http.target': req.path,
        'http.host': req.hostname,
        'http.scheme': req.protocol,
        'http.user_agent': req.get('user-agent') || 'unknown',
      });

      // Add custom attributes if user is authenticated
      if (req.user) {
        span.setAttribute('user.id', req.user.id);
        span.setAttribute('user.email', req.user.email);
      }

      // Record response
      const originalSend = res.send;
      res.send = function (data: any) {
        span.setAttribute('http.status_code', res.statusCode);
        span.setStatus({
          code: res.statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
        });
        span.end();
        return originalSend.call(this, data);
      };
    }

    next();
  };
}

/**
 * Trace database queries
 */
export async function traceQuery<T>(
  tracingService: TracingService,
  queryType: string,
  query: string,
  params: any[],
  executor: () => Promise<T>
): Promise<T> {
  return tracingService.createSpan(`db.query.${queryType}`, async (span) => {
    span.setAttributes({
      'db.system': 'postgresql',
      'db.statement': query,
      'db.operation': queryType,
    });

    const startTime = Date.now();
    try {
      const result = await executor();
      const duration = Date.now() - startTime;

      span.setAttribute('db.duration_ms', duration);
      return result;
    } catch (error: any) {
      span.recordException(error);
      throw error;
    }
  });
}

/**
 * Example usage in API routes
 */
export function exampleTracedRoute(tracingService: TracingService) {
  return async (req: any, res: any) => {
    // This will automatically be part of the parent HTTP span
    await tracingService.createSpan('business.logic', async (span) => {
      span.setAttribute('custom.attribute', 'value');

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Nested span
      await tracingService.createSpan('database.fetch', async (childSpan) => {
        childSpan.setAttribute('db.query', 'SELECT * FROM users');
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      res.json({ success: true });
    });
  };
}

// Export singleton instance
let tracingServiceInstance: TracingService | null = null;

export function initializeTracing(config: TracingConfig): TracingService {
  if (!tracingServiceInstance) {
    tracingServiceInstance = new TracingService(config);
    tracingServiceInstance.initialize();
  }
  return tracingServiceInstance;
}

export function getTracingService(): TracingService {
  if (!tracingServiceInstance) {
    throw new Error('Tracing service not initialized. Call initializeTracing() first.');
  }
  return tracingServiceInstance;
}
