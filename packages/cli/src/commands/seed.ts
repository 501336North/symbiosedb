/**
 * Auto-Seed CLI Command
 * Generates mock data across all 4 database types
 */

import { SeedOrchestrator, TableSchema, SeedOptions } from '@symbiosedb/auto-seed';

interface SeedCommandOptions {
  table?: string;
  count?: number;
  locale?: string;
  seed?: number;
  reset?: boolean;
  related?: boolean;
  batch?: boolean;
  config?: Array<{ tableName: string; count: number; dbType?: string }>;
}

export async function seedCommand(
  orchestrator: SeedOrchestrator,
  options: SeedCommandOptions
): Promise<void> {
  try {
    // Input validation
    if (options.batch) {
      // Batch mode
      if (!options.config || !Array.isArray(options.config)) {
        console.error('Error: config is required for batch mode');
        return;
      }

      await batchSeed(orchestrator, options);
    } else {
      // Single table mode
      if (!options.table) {
        console.error('Error: table name is required');
        return;
      }

      if (options.count === undefined || options.count === null) {
        console.error('Error: count is required');
        return;
      }

      if (
        typeof options.count !== 'number' ||
        options.count <= 0 ||
        !Number.isInteger(options.count)
      ) {
        console.error('Error: count must be a positive integer');
        return;
      }

      if (options.count > 10000) {
        console.error('Error: count must not exceed 10000');
        return;
      }

      if (options.related) {
        await seedRelated(orchestrator, options);
      } else {
        await seedSingle(orchestrator, options);
      }
    }
  } catch (error: any) {
    console.error(`Error seeding ${options.table}: ${error.message}`);
  }
}

/**
 * Seed a single table
 */
async function seedSingle(
  orchestrator: SeedOrchestrator,
  options: SeedCommandOptions
): Promise<void> {
  const { table, count, locale, seed, reset } = options;

  // Build seed options
  const seedOptions: SeedOptions | undefined =
    locale || seed !== undefined || reset
      ? { locale, seed, reset }
      : undefined;

  // TODO: In production, fetch actual schema from database
  // For now, create a mock schema
  const schema: TableSchema = {
    dbType: 'sql',
    tableName: table!,
    columns: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'email', type: 'string', nullable: false },
    ],
    primaryKeys: [],
    foreignKeys: [],
    uniqueConstraints: [],
  };

  const result = await orchestrator.seedTable(schema, count!, seedOptions);

  console.log(
    `✓ Successfully seeded ${result.recordsCreated} records into ${result.tableName} (${result.duration}ms)`
  );

  if (result.preview && result.preview.length > 0) {
    console.log(`\nPreview (first ${result.preview.length} records):`);
    console.log(JSON.stringify(result.preview, null, 2));
  }
}

/**
 * Seed a table and all its dependencies
 */
async function seedRelated(
  orchestrator: SeedOrchestrator,
  options: SeedCommandOptions
): Promise<void> {
  const { table, count, locale, seed, reset } = options;

  const seedOptions: SeedOptions | undefined =
    locale || seed !== undefined || reset
      ? { locale, seed, reset }
      : undefined;

  // TODO: Fetch actual schema
  const schema: TableSchema = {
    dbType: 'sql',
    tableName: table!,
    columns: [],
    primaryKeys: [],
    foreignKeys: [],
    uniqueConstraints: [],
  };

  const results = await orchestrator.seedRelatedTables(
    schema,
    count!,
    seedOptions
  );

  console.log(`\n✓ Seeding ${results.length} related tables:\n`);

  for (const result of results) {
    console.log(
      `  - ${result.tableName}: ${result.recordsCreated} records (${result.duration}ms)`
    );
  }

  const totalRecords = results.reduce(
    (sum, r) => sum + r.recordsCreated,
    0
  );
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(
    `\n✓ Total: ${totalRecords} records seeded in ${totalDuration}ms`
  );
}

/**
 * Seed multiple tables in one command
 */
async function batchSeed(
  orchestrator: SeedOrchestrator,
  options: SeedCommandOptions
): Promise<void> {
  const { config, locale, seed, reset } = options;

  const seedOptions: SeedOptions | undefined =
    locale || seed !== undefined || reset
      ? { locale, seed, reset }
      : undefined;

  // Build seed requests
  const requests = config!.map((tableConfig) => {
    // TODO: Fetch actual schema
    const schema: TableSchema = {
      dbType: (tableConfig.dbType as any) || 'sql',
      tableName: tableConfig.tableName,
      columns: [],
      primaryKeys: [],
      foreignKeys: [],
      uniqueConstraints: [],
    };

    return {
      tableName: tableConfig.tableName,
      dbType: schema.dbType,
      count: tableConfig.count,
      schema,
      options: seedOptions,
    };
  });

  console.log(`\n✓ Batch seeding ${requests.length} tables:\n`);

  const results = await orchestrator.seedMultipleTables(requests);

  for (const result of results) {
    console.log(
      `  - ${result.tableName}: ${result.recordsCreated} records (${result.duration}ms)`
    );
  }

  const totalRecords = results.reduce(
    (sum, r) => sum + r.recordsCreated,
    0
  );
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(
    `\n✓ Total: ${totalRecords} records seeded in ${totalDuration}ms`
  );
}
