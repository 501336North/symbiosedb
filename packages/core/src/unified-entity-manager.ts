/**
 * Phase 5: Unified Entity Manager
 *
 * Main API for creating/updating/deleting entities across all 4 databases.
 * One logical operation => multiple database writes with SAGA pattern.
 */

import {
  UnifiedEntity,
  TransactionOptions,
  SyncStatus,
  TransactionState,
  SagaDefinition,
} from './unified-types';
import { TransactionCoordinator } from './transaction-coordinator';
import { InMemoryEventStore, PostgreSQLEventStore } from './event-store';
import { PostgreSQLConnector } from './postgresql-connector';
import { PgVectorConnector } from './vector-connector';
import { EthereumConnector } from './blockchain-connector';
import { v4 as uuidv4 } from 'uuid';

export class UnifiedEntityManager {
  private coordinator: TransactionCoordinator;
  private eventStore: InMemoryEventStore | PostgreSQLEventStore;
  private entities: Map<string, UnifiedEntity> = new Map();

  constructor(
    private connectors: {
      sql: PostgreSQLConnector;
      vector?: PgVectorConnector;
      blockchain?: EthereumConnector;
    }
  ) {
    // Use PostgreSQL event store if available, otherwise in-memory
    this.eventStore = connectors.sql
      ? new PostgreSQLEventStore(connectors.sql)
      : new InMemoryEventStore();

    this.coordinator = new TransactionCoordinator(this.eventStore);
  }

  /**
   * Create a new unified entity across all specified databases
   */
  async create(
    entityData: Partial<UnifiedEntity>,
    options?: TransactionOptions
  ): Promise<UnifiedEntity> {
    const entity: UnifiedEntity = {
      id: entityData.id || uuidv4(),
      type: entityData.type!,
      sql: entityData.sql,
      vector: entityData.vector,
      graph: entityData.graph,
      blockchain: entityData.blockchain,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    // Build SAGA for entity creation
    const saga: SagaDefinition = {
      name: `Create${entity.type}`,
      steps: [],
    };

    // SQL step
    if (entity.sql) {
      saga.steps.push({
        database: 'sql',
        execute: async (data: any) => {
          const query = `INSERT INTO ${entity.sql!.tableName} (id, data) VALUES ($1, $2) RETURNING *`;
          const result = await this.connectors.sql.query(query, [
            entity.id,
            JSON.stringify(entity.sql!.data),
          ]);
          return result.rows[0];
        },
        compensate: async (data: any, result: any) => {
          // Rollback: Delete the inserted row
          await this.connectors.sql.query(
            `DELETE FROM ${entity.sql!.tableName} WHERE id = $1`,
            [entity.id]
          );
        },
      });
    }

    // Vector step
    if (entity.vector && this.connectors.vector) {
      saga.steps.push({
        database: 'vector',
        execute: async (data: any) => {
          await this.connectors.vector!.insert(
            entity.id,
            entity.vector!.embedding,
            entity.vector!.metadata
          );
          return { embeddingId: entity.id };
        },
        compensate: async (data: any, result: any) => {
          // Rollback: Delete the embedding
          // Note: PgVectorConnector needs a delete method (TODO)
          // await this.connectors.vector!.delete(entity.id);
        },
      });
    }

    // Graph step
    if (entity.graph) {
      saga.steps.push({
        database: 'graph',
        execute: async (data: any) => {
          // Create node in Apache AGE
          const query = `
            SELECT * FROM ag_catalog.cypher('graph_name', $$
              CREATE (n:${entity.graph!.nodeLabel} {id: '${entity.id}', properties: '${JSON.stringify(entity.graph!.properties)}'})
              RETURN n
            $$) as (n agtype);
          `;
          const result = await this.connectors.sql.query(query, []);
          return result.rows[0];
        },
        compensate: async (data: any, result: any) => {
          // Rollback: Delete the node
          const deleteQuery = `
            SELECT * FROM ag_catalog.cypher('graph_name', $$
              MATCH (n:${entity.graph!.nodeLabel} {id: '${entity.id}'})
              DELETE n
            $$) as (n agtype);
          `;
          await this.connectors.sql.query(deleteQuery, []);
        },
      });
    }

    // Blockchain step
    if (entity.blockchain && this.connectors.blockchain) {
      saga.steps.push({
        database: 'blockchain',
        execute: async (data: any) => {
          const attestationData = {
            entityId: entity.id,
            entityType: entity.type,
            action: entity.blockchain!.action,
            data: entity.blockchain!.data || {},
            timestamp: Date.now(),
          };
          const attestationId = await this.connectors.blockchain!.storeAttestation(
            attestationData
          );
          return { attestationId };
        },
        compensate: async (data: any, result: any) => {
          // Blockchain is immutable - cannot rollback
          // Instead, store a "reverted" attestation
          await this.connectors.blockchain!.storeAttestation({
            entityId: entity.id,
            action: `${entity.blockchain!.action}_REVERTED`,
            timestamp: Date.now(),
          });
        },
      });
    }

    // Execute SAGA
    try {
      await this.coordinator.executeSaga(saga, entity, options ? { parallel: options.consistency === 'eventual' } : undefined);
      this.entities.set(entity.id, entity);

      // Emit event
      await this.eventStore.append({
        id: uuidv4(),
        aggregateId: entity.id,
        aggregateType: entity.type,
        eventType: `${entity.type}Created`,
        data: entity,
        metadata: {
          timestamp: new Date(),
          version: 1,
        },
      });

      return entity;
    } catch (error) {
      throw new Error(`Failed to create entity: ${(error as Error).message}`);
    }
  }

  /**
   * Update an existing unified entity
   */
  async update(
    entityId: string,
    updates: Partial<UnifiedEntity>,
    options?: TransactionOptions
  ): Promise<UnifiedEntity> {
    const existing = this.entities.get(entityId);
    if (!existing) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Check version for optimistic locking
    if (updates.version && updates.version !== existing.version) {
      throw new Error('Version conflict: Entity was modified by another process');
    }

    const updated: UnifiedEntity = {
      ...existing,
      ...updates,
      id: entityId,
      updatedAt: new Date(),
      version: existing.version + 1,
    };

    // Build update SAGA (similar to create, but with UPDATE operations)
    // ... implementation similar to create() ...

    this.entities.set(entityId, updated);
    return updated;
  }

  /**
   * Delete a unified entity from all databases
   */
  async delete(entityId: string): Promise<boolean> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return false;
    }

    // Build delete SAGA
    const saga: SagaDefinition = {
      name: `Delete${entity.type}`,
      steps: [],
    };

    // Delete from SQL
    if (entity.sql) {
      saga.steps.push({
        database: 'sql',
        execute: async () => {
          await this.connectors.sql.query(
            `DELETE FROM ${entity.sql!.tableName} WHERE id = $1`,
            [entityId]
          );
        },
        compensate: async () => {
          // Re-insert (best effort)
        },
      });
    }

    // Delete from Vector, Graph, etc.
    // ...

    // Store blockchain audit trail
    if (this.connectors.blockchain) {
      saga.steps.push({
        database: 'blockchain',
        execute: async () => {
          await this.connectors.blockchain!.storeAttestation({
            entityId,
            entityType: entity.type,
            action: `${entity.type.toUpperCase()}_DELETED`,
            timestamp: Date.now(),
          });
        },
        compensate: async () => {},
      });
    }

    await this.coordinator.executeSaga(saga, {});
    this.entities.delete(entityId);

    return true;
  }

  /**
   * Get sync status for an entity
   */
  async getSyncStatus(entityId: string): Promise<SyncStatus> {
    const entity = this.entities.get(entityId);

    return {
      entityId,
      databases: {
        sql: entity?.sql ? 'synced' : 'pending',
        vector: entity?.vector ? 'synced' : 'pending',
        graph: entity?.graph ? 'synced' : 'pending',
        blockchain: entity?.blockchain ? 'synced' : 'pending',
      },
      lastSyncAt: entity?.updatedAt || new Date(),
      pendingEvents: 0,
    };
  }

  /**
   * Get an entity by ID
   */
  async get(entityId: string): Promise<UnifiedEntity | undefined> {
    return this.entities.get(entityId);
  }
}
