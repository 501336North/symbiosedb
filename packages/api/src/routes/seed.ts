/**
 * Auto-Seed REST API Routes
 * Endpoints for generating mock data across all 4 database types
 */

import express, { Request, Response, Router } from 'express';
import { SeedOrchestrator, TableSchema, SeedOptions } from '@symbiosedb/auto-seed';

export const seedRouter = Router();

/**
 * POST /api/:accountId/tables/:tableId/mock
 * Seed a single table with mock data
 *
 * Body:
 *   - count: number (required, 1-10,000)
 *   - locale?: string (optional, e.g., 'fr_FR')
 *   - seed?: number (optional, for reproducible data)
 *   - reset?: boolean (optional, clear existing data first)
 */
seedRouter.post(
  '/:accountId/tables/:tableId/mock',
  async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const { count, locale, seed, reset } = req.body;

      // Validation
      if (count === undefined || count === null) {
        return res.status(400).json({
          success: false,
          error: 'count is required',
        });
      }

      if (typeof count !== 'number' || count <= 0 || !Number.isInteger(count)) {
        return res.status(400).json({
          success: false,
          error: 'count must be a positive integer',
        });
      }

      if (count > 10000) {
        return res.status(400).json({
          success: false,
          error: 'count must not exceed 10000',
        });
      }

      // Get orchestrator from app context
      const orchestrator: SeedOrchestrator = (req.app as any).seedOrchestrator;

      // Build seed options
      const options: SeedOptions | undefined =
        locale || seed !== undefined || reset
          ? { locale, seed, reset }
          : undefined;

      // TODO: In production, fetch actual schema from database
      // For now, create a mock schema (will be replaced with real schema lookup)
      const schema: TableSchema = {
        dbType: 'sql',
        tableName: tableId,
        columns: [
          { name: 'id', type: 'uuid', isPrimaryKey: true, nullable: false },
          { name: 'name', type: 'string', nullable: false },
          { name: 'email', type: 'string', nullable: false },
        ],
        primaryKeys: [],
        foreignKeys: [],
        uniqueConstraints: [],
      };

      // Seed the table
      const result = await orchestrator.seedTable(schema, count, options);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/:accountId/tables/:tableId/mock-related
 * Seed a table and all its dependencies (foreign key tables)
 *
 * Body:
 *   - count: number (required)
 *   - locale?: string
 *   - seed?: number
 *   - reset?: boolean
 */
seedRouter.post(
  '/:accountId/tables/:tableId/mock-related',
  async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const { count, locale, seed, reset } = req.body;

      // Validation
      if (count === undefined || count === null) {
        return res.status(400).json({
          success: false,
          error: 'count is required',
        });
      }

      if (typeof count !== 'number' || count <= 0 || !Number.isInteger(count)) {
        return res.status(400).json({
          success: false,
          error: 'count must be a positive integer',
        });
      }

      const orchestrator: SeedOrchestrator = (req.app as any).seedOrchestrator;

      const options: SeedOptions | undefined =
        locale || seed !== undefined || reset
          ? { locale, seed, reset }
          : undefined;

      // TODO: Fetch actual schema
      const schema: TableSchema = {
        dbType: 'sql',
        tableName: tableId,
        columns: [],
        primaryKeys: [],
        foreignKeys: [],
        uniqueConstraints: [],
      };

      const results = await orchestrator.seedRelatedTables(
        schema,
        count,
        options
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/:accountId/mock-batch
 * Seed multiple tables in one request (respects dependencies)
 *
 * Body:
 *   - tables: Array<{ tableName: string, count: number, dbType?: string }>
 *   - locale?: string
 *   - seed?: number
 *   - reset?: boolean
 */
seedRouter.post(
  '/:accountId/mock-batch',
  async (req: Request, res: Response) => {
    try {
      const { tables, locale, seed, reset } = req.body;

      // Validation
      if (!Array.isArray(tables)) {
        return res.status(400).json({
          success: false,
          error: 'tables array is required',
        });
      }

      const orchestrator: SeedOrchestrator = (req.app as any).seedOrchestrator;

      const options: SeedOptions | undefined =
        locale || seed !== undefined || reset
          ? { locale, seed, reset }
          : undefined;

      // Build seed requests
      const requests = tables.map((table) => {
        // TODO: Fetch actual schema
        const schema: TableSchema = {
          dbType: (table.dbType as any) || 'sql',
          tableName: table.tableName,
          columns: [],
          primaryKeys: [],
          foreignKeys: [],
          uniqueConstraints: [],
        };

        return {
          tableName: table.tableName,
          dbType: schema.dbType,
          count: table.count,
          schema,
          options,
        };
      });

      const results = await orchestrator.seedMultipleTables(requests);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/:accountId/tables/:tableId/seeded-data
 * Retrieve seeded data for a table
 */
seedRouter.get(
  '/:accountId/tables/:tableId/seeded-data',
  (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const orchestrator: SeedOrchestrator = (req.app as any).seedOrchestrator;

      const data = orchestrator.getSeededData(tableId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
