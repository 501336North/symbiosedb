/**
 * Phase 5: Event Store Implementation
 *
 * Event sourcing foundation for unified database synchronization.
 * Every state change is captured as an immutable event.
 */

import { DomainEvent, EventStore } from './unified-types';
import { PostgreSQLConnector } from './postgresql-connector';

/**
 * In-Memory Event Store (for development/testing)
 * Production should use PostgreSQL-backed implementation
 */
export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();
  private allEvents: DomainEvent[] = [];
  private eventIds: Set<string> = new Set();

  async append(event: DomainEvent): Promise<void> {
    // Prevent duplicate events
    if (this.eventIds.has(event.id)) {
      throw new Error(`Event already exists: ${event.id}`);
    }

    // Add to aggregate-specific list
    const aggregateEvents = this.events.get(event.aggregateId) || [];
    aggregateEvents.push(event);
    this.events.set(event.aggregateId, aggregateEvents);

    // Add to global list
    this.allEvents.push(event);
    this.eventIds.add(event.id);
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    return this.events.get(aggregateId) || [];
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    return this.allEvents.filter((e) => e.eventType === eventType);
  }

  async getEventsSince(timestamp: Date): Promise<DomainEvent[]> {
    return this.allEvents.filter(
      (e) => e.metadata.timestamp >= timestamp
    );
  }

  /**
   * Replay events to rebuild aggregate state
   */
  async replayEvents(aggregateId: string): Promise<any> {
    const events = await this.getEvents(aggregateId);
    if (events.length === 0) {
      return null;
    }

    // Apply events in order to rebuild state
    let state: any = {};
    let isDeleted = false;

    for (const event of events) {
      switch (event.eventType) {
        case 'UserCreated':
        case 'ProductCreated':
          state = { ...event.data };
          break;

        case 'UserUpdated':
        case 'ProductUpdated':
          state = { ...state, ...event.data };
          break;

        case 'UserDeleted':
        case 'ProductDeleted':
          isDeleted = true;
          break;

        default:
          // Generic update
          if (event.eventType.endsWith('Created')) {
            state = { ...event.data };
          } else if (event.eventType.endsWith('Updated')) {
            state = { ...state, ...event.data };
          } else if (event.eventType.endsWith('Deleted')) {
            isDeleted = true;
          }
      }
    }

    return isDeleted ? null : state;
  }

  /**
   * Clear all events (for testing)
   */
  async clear(): Promise<void> {
    this.events.clear();
    this.allEvents = [];
    this.eventIds.clear();
  }
}

/**
 * PostgreSQL-backed Event Store (for production)
 */
export class PostgreSQLEventStore implements EventStore {
  constructor(private connector: PostgreSQLConnector) {}

  async append(event: DomainEvent): Promise<void> {
    const query = `
      INSERT INTO events (
        id, aggregate_id, aggregate_type, event_type, data, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    try {
      await this.connector.query(query, [
        event.id,
        event.aggregateId,
        event.aggregateType,
        event.eventType,
        JSON.stringify(event.data),
        JSON.stringify(event.metadata),
        event.metadata.timestamp,
      ]);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error(`Event already exists: ${event.id}`);
      }
      throw error;
    }
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const query = `
      SELECT * FROM events
      WHERE aggregate_id = $1
      ORDER BY created_at ASC
    `;

    const result = await this.connector.query(query, [aggregateId]);
    return result.rows.map(this.rowToEvent);
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    const query = `
      SELECT * FROM events
      WHERE event_type = $1
      ORDER BY created_at ASC
    `;

    const result = await this.connector.query(query, [eventType]);
    return result.rows.map(this.rowToEvent);
  }

  async getEventsSince(timestamp: Date): Promise<DomainEvent[]> {
    const query = `
      SELECT * FROM events
      WHERE created_at >= $1
      ORDER BY created_at ASC
    `;

    const result = await this.connector.query(query, [timestamp]);
    return result.rows.map(this.rowToEvent);
  }

  async replayEvents(aggregateId: string): Promise<any> {
    const events = await this.getEvents(aggregateId);
    if (events.length === 0) return null;

    let state: any = {};
    let isDeleted = false;

    for (const event of events) {
      switch (event.eventType) {
        case 'UserCreated':
        case 'ProductCreated':
          state = { ...event.data };
          break;
        case 'UserUpdated':
        case 'ProductUpdated':
          state = { ...state, ...event.data };
          break;
        case 'UserDeleted':
        case 'ProductDeleted':
          isDeleted = true;
          break;
      }
    }

    return isDeleted ? null : state;
  }

  private rowToEvent(row: any): DomainEvent {
    return {
      id: row.id,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      eventType: row.event_type,
      data: JSON.parse(row.data),
      metadata: JSON.parse(row.metadata),
    };
  }
}

/**
 * Create events table migration
 */
export const createEventsTableSQL = `
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(255) PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indexes for performance
  INDEX idx_aggregate_id (aggregate_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
);
`;
