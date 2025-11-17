# SymbioseDB CLI

> Professional database migrations and seeding for SymbioseDB

The SymbioseDB CLI provides a powerful, intuitive interface for managing database migrations and seeding data in your SymbioseDB projects. Built with TypeScript, it offers type-safe database schema management with automatic rollback on failure.

## ✨ Features

- **🚀 Database Migrations** - Version-controlled schema changes with automatic rollback
- **🌱 Data Seeding** - Populate your database with initial or test data
- **📦 TypeScript First** - Full type safety for your migrations and seeds
- **⏮️ Rollback Support** - Automatic compensation on migration failures
- **📊 Status Tracking** - Know exactly which migrations have been applied
- **🎯 Targeted Execution** - Run specific migrations or seeds
- **🔄 Sequential Execution** - Seeds run in order for dependency management

---

## 📦 Installation

```bash
# Using npm
npm install -g @symbiosedb/cli

# Using yarn
yarn global add @symbiosedb/cli

# Using pnpm
pnpm add -g @symbiosedb/cli
```

---

## 🚀 Quick Start

### Initialize Your Database

```bash
# Configure your database connection
symbiosedb configure
```

### Create Your First Migration

```bash
# Create a new migration
symbiosedb migrate create create_users_table

# This generates: ./migrations/20250114120000_create_users_table.ts
```

### Edit the Migration

```typescript
import { PostgreSQLConnector } from '@symbiosedb/core';

export async function up({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function down({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`DROP TABLE IF EXISTS users;`);
}
```

### Run Migrations

```bash
# Run all pending migrations
symbiosedb migrate up

# ✓ Ran 1 migration(s)
#   - 20250114120000_create_users_table.ts
```

---

## 📚 Command Reference

### General Commands

#### `configure`

Configure the CLI with your API endpoint and credentials.

```bash
symbiosedb configure
```

**Interactive Prompts:**
- API URL (default: `http://localhost:3000`)
- API Key (optional)

#### `health`

Check the health status of your SymbioseDB API.

```bash
symbiosedb health [options]

Options:
  -u, --url <url>  API URL (default: "http://localhost:3000")
```

---

### Migration Commands

Migrations are version-controlled database schema changes. Each migration has an `up()` function (apply changes) and a `down()` function (rollback changes).

#### `migrate create <description>`

Generate a new migration file with timestamp-based naming.

```bash
symbiosedb migrate create add_user_roles

# Creates: ./migrations/20250114123045_add_user_roles.ts
```

**Naming Convention:**
- Format: `YYYYMMDDHHMMSS_description.ts`
- Timestamps ensure chronological ordering
- Descriptions use snake_case

#### `migrate up [target]`

Run all pending migrations or migrate to a specific target.

```bash
# Run all pending migrations
symbiosedb migrate up

# Run up to a specific migration
symbiosedb migrate up 20250114120000_create_users_table.ts
```

**Behavior:**
- Runs migrations in chronological order
- Automatically tracks executed migrations in `.migrations.json`
- **Automatic rollback** if any migration fails
- Skips already-executed migrations

**Example Output:**
```
✓ Ran 3 migration(s)
  - 20250114120000_create_users_table.ts
  - 20250114121500_create_posts_table.ts
  - 20250114122000_add_indexes.ts
```

#### `migrate down [target]`

Rollback the last migration or revert to a specific target.

```bash
# Rollback the last migration
symbiosedb migrate down

# Rollback to a specific migration
symbiosedb migrate down 20250114120000_create_users_table.ts
```

**Warning:** Down migrations delete data! Always backup before rolling back.

#### `migrate status`

Show the status of all migrations (executed vs. pending).

```bash
symbiosedb migrate status
```

**Example Output:**
```
Migration Status:

✓ Executed (2):
  - 20250114120000_create_users_table.ts (2025-01-14T12:05:23.456Z)
  - 20250114121500_create_posts_table.ts (2025-01-14T12:05:24.123Z)

⏳ Pending (1):
  - 20250114122000_add_indexes.ts
```

---

### Seed Commands

Seeds populate your database with initial or test data. Unlike migrations, seeds are idempotent and can be run multiple times.

#### `seed create <description>`

Generate a new seed file with sequential numbering.

```bash
symbiosedb seed create users

# Creates: ./seeds/01_users.ts
```

**Naming Convention:**
- Format: `NN_description.ts` (e.g., `01_users.ts`, `02_posts.ts`)
- Sequential numbers ensure execution order
- Auto-increments based on existing seeds

#### `seed run [filename]`

Run all seeds or a specific seed file.

```bash
# Run all seeds
symbiosedb seed run

# Run a specific seed
symbiosedb seed run 01_users.ts
```

**Behavior:**
- Runs in sequential order (01, 02, 03, ...)
- Stops execution on first failure
- No automatic tracking (can be re-run anytime)

**Example Output:**
```
✓ Ran 2 seed(s)
  - 01_users.ts
  - 02_posts.ts
```

---

### Query Commands

Execute SQL queries or perform vector/blockchain operations via the CLI.

#### `query <sql>`

Execute a SQL query.

```bash
symbiosedb query "SELECT * FROM users LIMIT 5" --url http://localhost:3000
```

#### `vector-search`

Perform vector similarity search.

```bash
symbiosedb vector-search \
  --embedding "0.1,0.2,0.3,0.4" \
  --limit 10 \
  --url http://localhost:3000
```

#### `attest <data>`

Store an attestation on the blockchain.

```bash
symbiosedb attest '{"userId": "123", "action": "login"}' --url http://localhost:3000
```

#### `verify <attestationId>`

Verify an attestation from the blockchain.

```bash
symbiosedb verify abc123def456 --url http://localhost:3000
```

---

## 🔧 Configuration

### Environment Variables

Configure database connections via environment variables:

```bash
# PostgreSQL Connection
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=symbiosedb
export DB_USER=postgres
export DB_PASSWORD=your_password

# SymbioseDB API
export SYMBIOSEDB_API_URL=http://localhost:3000
export SYMBIOSEDB_API_KEY=your_api_key
```

### Configuration File

Alternatively, create a `.symbiosedbrc` file in your project root:

```json
{
  "apiURL": "http://localhost:3000",
  "apiKey": "your_api_key",
  "migrationsDir": "./migrations",
  "seedsDir": "./seeds"
}
```

---

## 📖 Migration Workflow

### 1. Create a Migration

```bash
symbiosedb migrate create add_email_verification
```

### 2. Edit the Generated File

```typescript
import { PostgreSQLConnector } from '@symbiosedb/core';

export async function up({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`
    ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN verification_token VARCHAR(255);
  `);
}

export async function down({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`
    ALTER TABLE users
    DROP COLUMN email_verified,
    DROP COLUMN verification_token;
  `);
}
```

### 3. Check Migration Status

```bash
symbiosedb migrate status
```

### 4. Run the Migration

```bash
symbiosedb migrate up
```

### 5. Verify in Database

```bash
symbiosedb query "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
```

---

## 🌱 Seeding Workflow

### 1. Create a Seed

```bash
symbiosedb seed create demo_users
```

### 2. Edit the Generated File

```typescript
import { PostgreSQLConnector } from '@symbiosedb/core';

export async function run({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  await sql.query(`
    INSERT INTO users (email, name, email_verified) VALUES
      ('alice@example.com', 'Alice Anderson', true),
      ('bob@example.com', 'Bob Brown', true),
      ('charlie@example.com', 'Charlie Clark', false);
  `);
}
```

### 3. Run Seeds

```bash
# Run all seeds in order
symbiosedb seed run

# Or run a specific seed
symbiosedb seed run 01_demo_users.ts
```

---

## 🎯 Best Practices

### Migration Guidelines

✅ **DO:**
- Write both `up()` and `down()` for every migration
- Use descriptive migration names
- Make migrations atomic (one logical change per migration)
- Test migrations on a development database first
- Include indexes in the same migration as table creation
- Use transactions for data migrations

❌ **DON'T:**
- Edit existing migrations that have been run in production
- Delete migration files
- Skip writing `down()` functions
- Make breaking changes without a rollback plan

### Seed Guidelines

✅ **DO:**
- Make seeds idempotent (safe to run multiple times)
- Use seeds for development/test data
- Document seed dependencies
- Keep seed data realistic

❌ **DON'T:**
- Use seeds for production data migrations (use migrations instead)
- Store sensitive data in seed files
- Make seeds dependent on specific migration timing

### Example: Idempotent Seed

```typescript
export async function run({ sql }: { sql: PostgreSQLConnector }): Promise<void> {
  // Delete existing data first
  await sql.query(`DELETE FROM users WHERE email LIKE '%@example.com'`);

  // Then insert fresh data
  await sql.query(`
    INSERT INTO users (email, name) VALUES
      ('test1@example.com', 'Test User 1'),
      ('test2@example.com', 'Test User 2');
  `);
}
```

---

## 🐛 Troubleshooting

### Migration Fails to Run

**Problem:** `Migration failed: relation "users" does not exist`

**Solution:** Ensure migrations run in order. Check `migrate status` to see which migrations are pending.

### Rollback Not Working

**Problem:** `down()` function throws an error

**Solution:** Ensure your `down()` function properly reverses all changes made in `up()`. Test rollback on a dev database.

### Seed Data Not Appearing

**Problem:** Seed runs successfully but no data

**Solution:**
1. Check that your database connection is correct
2. Verify the SQL syntax in your seed file
3. Check database logs for errors
4. Ensure no constraints are blocking inserts

### Connection Errors

**Problem:** `Cannot connect to database`

**Solution:**
1. Verify environment variables are set correctly
2. Check that PostgreSQL is running
3. Confirm network access to database
4. Test connection with `symbiosedb health`

---

## 📂 Project Structure

```
your-project/
├── migrations/           # Database migrations
│   ├── 20250114120000_create_users_table.ts
│   ├── 20250114121500_create_posts_table.ts
│   └── .migrations.json  # Tracking file (auto-generated)
├── seeds/               # Seed data
│   ├── 01_users.ts
│   └── 02_posts.ts
└── .symbiosedbrc        # Optional configuration
```

---

## 🔍 Examples

Complete working examples are available in the [`examples/`](./examples/) directory:

- **Migrations:**
  - [`20250101120000_create_users_table.ts`](./examples/migrations/20250101120000_create_users_table.ts) - User table with indexes
  - [`20250101130000_create_posts_table.ts`](./examples/migrations/20250101130000_create_posts_table.ts) - Posts with foreign keys

- **Seeds:**
  - [`01_users.ts`](./examples/seeds/01_users.ts) - Sample user data
  - [`02_posts.ts`](./examples/seeds/02_posts.ts) - Sample blog posts

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

---

## 📄 License

MIT © [SymbioseDB](https://symbiosedb.com)

---

## 🔗 Links

- [Documentation](https://docs.symbiosedb.com)
- [GitHub](https://github.com/symbiosedb/symbiosedb)
- [Discord Community](https://discord.gg/symbiosedb)
- [Report Issues](https://github.com/symbiosedb/symbiosedb/issues)

---

**Built with ❤️ for the developer community**
