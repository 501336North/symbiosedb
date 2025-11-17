/**
 * GraphQL Server with Playground
 * Express server serving GraphQL API with interactive playground
 */

import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import expressPlayground from 'graphql-playground-middleware-express';
import { buildSchema } from './schema';
import { createContext, Context, ContextOptions } from './context';

export interface ServerOptions {
  port?: number;
  connectors: ContextOptions;
  enablePlayground?: boolean;
}

export function createServer(options: ServerOptions) {
  const {
    port = 4000,
    connectors,
    enablePlayground = true,
  } = options;

  const app = express();
  const schema = buildSchema();

  // Create context for each request
  const contextFactory = () => createContext(connectors);

  // GraphQL endpoint
  app.use(
    '/graphql',
    graphqlHTTP({
      schema,
      context: contextFactory(),
      graphiql: false, // We use Playground instead
    })
  );

  // GraphQL Playground (interactive API explorer)
  if (enablePlayground) {
    app.get('/playground', expressPlayground({
      endpoint: '/graphql',
      settings: {
        'editor.theme': 'dark',
        'editor.fontSize': 14,
        'editor.fontFamily': '"Fira Code", "SF Mono", "Monaco", monospace',
        'editor.cursorShape': 'line',
        'tracing.hideTracingResponse': false,
      },
    }) as any); // Type cast needed due to express-graphql-playground types
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'graphql-api',
      timestamp: new Date().toISOString(),
    });
  });

  // Start server
  const server = app.listen(port, () => {
    console.log(`🚀 GraphQL Server ready at: http://localhost:${port}/graphql`);
    if (enablePlayground) {
      console.log(`🎮 GraphQL Playground at: http://localhost:${port}/playground`);
    }
    console.log(`💚 Health check at: http://localhost:${port}/health`);
  });

  return {
    app,
    server,
    close: () => {
      return new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}
