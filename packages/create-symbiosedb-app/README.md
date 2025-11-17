# create-symbiosedb-app

Create SymbioseDB applications with one command.

## Quick Start

```bash
npx create-symbiosedb-app my-app
```

Or with npm:

```bash
npm create symbiosedb-app my-app
```

Or with yarn:

```bash
yarn create symbiosedb-app my-app
```

## Usage

### Interactive Mode

Run without arguments for an interactive setup:

```bash
npx create-symbiosedb-app
```

You'll be prompted to:
1. Enter a project name
2. Choose a template
3. Confirm dependency installation

### Non-Interactive Mode

Provide all options via command-line flags:

```bash
npx create-symbiosedb-app my-app --template rag-app
```

### Options

- `[project-name]` - Name of your project (optional, prompts if not provided)
- `-t, --template <template>` - Template to use: `rag-app`, `basic-crud`, `multi-db` (optional)
- `--no-install` - Skip automatic dependency installation

## Available Templates

### 🤖 RAG App (rag-app)

AI-powered search and Q&A application with Retrieval-Augmented Generation.

**Features:**
- Semantic search with multi-query fusion
- Q&A system with source citations
- Auto-embedding of documents
- Beautiful Next.js 14 UI with Tailwind CSS
- 5-minute setup

**Perfect for:**
- Knowledge bases
- Documentation search
- Customer support chatbots
- Research assistants

### 📝 Basic CRUD (basic-crud)

Simple CRUD application with PostgreSQL.

**Features:**
- RESTful API with Express.js
- PostgreSQL database
- TypeScript throughout
- Basic authentication
- Simple admin interface

**Perfect for:**
- Simple web applications
- API backends
- Learning SymbioseDB basics
- Prototyping

### 🔷 Multi-Database (multi-db)

Full-stack application using all 4 database types (SQL, Vector, Graph, Blockchain).

**Features:**
- Unified entity management
- SAGA pattern for distributed transactions
- Event sourcing and audit trails
- Intelligent query routing
- Docker Compose setup included

**Perfect for:**
- Complex applications
- Multi-database architectures
- Enterprise applications
- Advanced use cases

## Examples

### Create a RAG app

```bash
npx create-symbiosedb-app my-rag-app --template rag-app
cd my-rag-app
npm run dev
```

### Create without installing dependencies

```bash
npx create-symbiosedb-app my-app --template basic-crud --no-install
cd my-app
npm install
npm run dev
```

## What's Created?

When you create a new app, you'll get:

- ✅ Project scaffolding
- ✅ TypeScript configuration
- ✅ SymbioseDB integration
- ✅ Sample code and documentation
- ✅ Development server setup
- ✅ Production build scripts (where applicable)

## Next Steps

After creating your app:

1. **Navigate to your project:**
   ```bash
   cd my-app
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Customize your app:**
   - Update configuration files
   - Modify sample code
   - Add your own features

## Requirements

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

## Troubleshooting

### "Template not found" error

Make sure you're using a valid template name:
- `rag-app`
- `basic-crud`
- `multi-db`

### Dependency installation fails

If automatic installation fails, you can install manually:

```bash
cd my-app
npm install
```

### Permission errors

On Unix-based systems, you may need to use `sudo`:

```bash
sudo npx create-symbiosedb-app my-app
```

## Learn More

- [SymbioseDB Documentation](https://github.com/symbiosedb/symbiosedb)
- [Next.js Documentation](https://nextjs.org/docs) (for RAG app template)
- [Express.js Documentation](https://expressjs.com/) (for CRUD template)

## License

MIT
