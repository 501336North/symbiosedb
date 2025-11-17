/**
 * Template definitions for create-symbiosedb-app
 *
 * Each template represents a different starter project type
 */

export interface Template {
  id: string;
  name: string;
  emoji: string;
  description: string;
  sourcePath: string;
  postInstallMessage?: string;
}

export const templates: Template[] = [
  {
    id: 'rag-app',
    name: 'Next.js RAG App',
    emoji: '🤖',
    description: 'AI-powered search and Q&A with RAG (Retrieval-Augmented Generation)',
    sourcePath: 'templates/nextjs-rag-app',
    postInstallMessage: `
  The sample documents are automatically indexed on first run.
  Navigate to http://localhost:3000 to see your RAG app in action!

  Customize your app:
  - Add documents in data/sample-docs.ts
  - Adjust RAG settings in lib/symbiosedb.ts
  - Modify UI components in components/
    `.trim(),
  },
  {
    id: 'basic-crud',
    name: 'Basic CRUD App',
    emoji: '📝',
    description: 'Simple CRUD application with PostgreSQL',
    sourcePath: 'templates/basic-crud-app',
    postInstallMessage: `
  This template includes:
  - PostgreSQL connection
  - RESTful API endpoints
  - Basic CRUD operations
  - TypeScript throughout

  Set up your database:
  1. Copy .env.example to .env
  2. Update DATABASE_URL with your PostgreSQL connection
  3. Run migrations: npm run migrate
    `.trim(),
  },
  {
    id: 'multi-db',
    name: 'Multi-Database App',
    emoji: '🔷',
    description: 'Full-stack app using SQL, Vector, Graph, and Blockchain',
    sourcePath: 'templates/multi-db-app',
    postInstallMessage: `
  This template demonstrates:
  - Unified entity management across 4 database types
  - SAGA pattern for distributed transactions
  - Event sourcing and audit trails
  - Intelligent query routing

  Set up your databases:
  1. Run docker-compose up -d to start all databases
  2. Copy .env.example to .env
  3. Run migrations: npm run migrate
    `.trim(),
  },
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
