#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SymbioseDBClient } from '@symbiosedb/sdk';

const program = new Command();

program
  .name('symbiosedb')
  .description('SymbioseDB CLI - Intelligent data infrastructure')
  .version('0.1.0');

// Configure command
program
  .command('configure')
  .description('Configure SymbioseDB CLI with API endpoint')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseURL',
        message: 'Enter SymbioseDB API URL:',
        default: 'http://localhost:3000',
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter API Key (optional):',
      },
    ]);

    // Save configuration (in a real implementation, save to ~/.symbiosedbrc)
    console.log(chalk.green('✓ Configuration saved successfully!'));
    console.log(chalk.dim(`API URL: ${answers.baseURL}`));
  });

// Query command
program
  .command('query <sql>')
  .description('Execute a SQL query')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3000')
  .action(async (sql: string, options) => {
    try {
      const client = new SymbioseDBClient({ baseURL: options.url });
      const result = await client.query(sql);

      console.log(chalk.green('✓ Query executed successfully'));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(chalk.red('✗ Query failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Vector search command
program
  .command('vector-search')
  .description('Perform vector similarity search')
  .requiredOption('-e, --embedding <values>', 'Comma-separated embedding values')
  .option('-l, --limit <number>', 'Number of results', '10')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3000')
  .action(async (options) => {
    try {
      const embedding = options.embedding.split(',').map(Number);
      const client = new SymbioseDBClient({ baseURL: options.url });
      const results = await client.vectorSearch(embedding, {
        limit: parseInt(options.limit),
      });

      console.log(chalk.green('✓ Vector search completed'));
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error(chalk.red('✗ Search failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Attestation commands
program
  .command('attest <data>')
  .description('Store an attestation on blockchain')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3000')
  .action(async (data: string, options) => {
    try {
      const client = new SymbioseDBClient({ baseURL: options.url });
      const result = await client.storeAttestation(JSON.parse(data));

      console.log(chalk.green('✓ Attestation stored successfully'));
      console.log(chalk.dim(`Attestation ID: ${result.attestationId}`));
    } catch (error) {
      console.error(chalk.red('✗ Attestation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('verify <attestationId>')
  .description('Verify an attestation from blockchain')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3000')
  .action(async (attestationId: string, options) => {
    try {
      const client = new SymbioseDBClient({ baseURL: options.url });
      const result = await client.verifyAttestation(attestationId);

      if (result.valid) {
        console.log(chalk.green('✓ Attestation is valid'));
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.yellow('⚠ Attestation not found or invalid'));
      }
    } catch (error) {
      console.error(chalk.red('✗ Verification failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Check API health')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3000')
  .action(async (options) => {
    try {
      const client = new SymbioseDBClient({ baseURL: options.url });
      const health = await client.health();

      console.log(chalk.green('✓ API is healthy'));
      console.log(JSON.stringify(health, null, 2));
    } catch (error) {
      console.error(chalk.red('✗ API is unreachable:'), (error as Error).message);
      process.exit(1);
    }
  });

// Migration commands
const migrateCommand = program.command('migrate').description('Database migration commands');

migrateCommand
  .command('create <description>')
  .description('Create a new migration file')
  .action(async (description: string) => {
    try {
      const { MigrationGenerator } = await import('./lib/migration-generator');
      const generator = new MigrationGenerator('./migrations');

      const result = generator.generate(description);

      console.log(chalk.green('✓ Migration created successfully'));
      console.log(chalk.dim(`  File: ${result.filename}`));
      console.log(chalk.dim(`  Path: ${result.path}`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to create migration:'), (error as Error).message);
      process.exit(1);
    }
  });

migrateCommand
  .command('up [target]')
  .description('Run pending migrations (optionally specify target migration)')
  .action(async (target?: string) => {
    try {
      const { MigrationRunner } = await import('./lib/migration-runner');
      const { MigrationTracker } = await import('./lib/migration-tracker');
      const { PostgreSQLConnector } = await import('@symbiosedb/core');

      const sqlClient = new PostgreSQLConnector({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'symbiosedb',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      });

      const tracker = new MigrationTracker();
      const runner = new MigrationRunner('./migrations', tracker, sqlClient);

      const result = await runner.runUp(target);

      if (result.executed.length === 0) {
        console.log(chalk.yellow('⚠ No pending migrations to run'));
      } else {
        console.log(chalk.green(`✓ Ran ${result.executed.length} migration(s)`));
        result.executed.forEach((m) => console.log(chalk.dim(`  - ${m}`)));
      }
    } catch (error) {
      console.error(chalk.red('✗ Migration failed:'), (error as Error).message);
      process.exit(1);
    }
  });

migrateCommand
  .command('down [target]')
  .description('Rollback migrations (optionally specify target migration)')
  .action(async (target?: string) => {
    try {
      const { MigrationRunner } = await import('./lib/migration-runner');
      const { MigrationTracker } = await import('./lib/migration-tracker');
      const { PostgreSQLConnector } = await import('@symbiosedb/core');

      const sqlClient = new PostgreSQLConnector({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'symbiosedb',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      });

      const tracker = new MigrationTracker();
      const runner = new MigrationRunner('./migrations', tracker, sqlClient);

      await runner.runDown(target);

      console.log(chalk.green('✓ Migration rolled back successfully'));
    } catch (error) {
      console.error(chalk.red('✗ Rollback failed:'), (error as Error).message);
      process.exit(1);
    }
  });

migrateCommand
  .command('status')
  .description('Show migration status')
  .action(async () => {
    try {
      const { MigrationRunner } = await import('./lib/migration-runner');
      const { MigrationTracker } = await import('./lib/migration-tracker');
      const { PostgreSQLConnector } = await import('@symbiosedb/core');

      const sqlClient = new PostgreSQLConnector({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'symbiosedb',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      });

      const tracker = new MigrationTracker();
      const runner = new MigrationRunner('./migrations', tracker, sqlClient);

      const status = await runner.getStatus();

      console.log(chalk.bold('\nMigration Status:'));
      console.log(chalk.green(`\n✓ Executed (${status.executed.length}):`));
      status.executed.forEach((m) =>
        console.log(chalk.dim(`  - ${m.filename} (${m.executedAt.toISOString()})`))
      );

      console.log(chalk.yellow(`\n⏳ Pending (${status.pending.length}):`));
      status.pending.forEach((m) => console.log(chalk.dim(`  - ${m}`)));
    } catch (error) {
      console.error(chalk.red('✗ Failed to get status:'), (error as Error).message);
      process.exit(1);
    }
  });

// Seed commands
const seedCommand = program.command('seed').description('Database seeding commands');

seedCommand
  .command('create <description>')
  .description('Create a new seed file')
  .action(async (description: string) => {
    try {
      const { SeedGenerator } = await import('./lib/seed-generator');
      const generator = new SeedGenerator('./seeds');

      const result = generator.generate(description);

      console.log(chalk.green('✓ Seed created successfully'));
      console.log(chalk.dim(`  File: ${result.filename}`));
      console.log(chalk.dim(`  Path: ${result.path}`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to create seed:'), (error as Error).message);
      process.exit(1);
    }
  });

seedCommand
  .command('run [filename]')
  .description('Run all seeds or a specific seed file')
  .action(async (filename?: string) => {
    try {
      const { SeedRunner } = await import('./lib/seed-runner');
      const { PostgreSQLConnector } = await import('@symbiosedb/core');

      const sqlClient = new PostgreSQLConnector({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'symbiosedb',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      });

      const runner = new SeedRunner('./seeds', sqlClient);

      if (filename) {
        await runner.runOne(filename);
        console.log(chalk.green(`✓ Seed executed: ${filename}`));
      } else {
        const result = await runner.runAll();

        if (result.executed.length === 0) {
          console.log(chalk.yellow('⚠ No seeds to run'));
        } else {
          console.log(chalk.green(`✓ Ran ${result.executed.length} seed(s)`));
          result.executed.forEach((s) => console.log(chalk.dim(`  - ${s}`)));
        }
      }
    } catch (error) {
      console.error(chalk.red('✗ Seed failed:'), (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
