/**
 * DocumentAPI - MongoDB-style API on PostgreSQL JSONB
 * (Current implementation: In-memory for testing)
 */

import { DocumentCollection } from './document-collection';
import type { IDocumentAPI, IDocumentCollection, CollectionOptions } from './types';

export class DocumentAPI implements IDocumentAPI {
  private collections: Map<string, DocumentCollection>;

  constructor() {
    this.collections = new Map();
  }

  /**
   * Get or create a collection
   */
  collection(name: string, options?: CollectionOptions): IDocumentCollection {
    if (this.collections.has(name)) {
      return this.collections.get(name)!;
    }

    const collection = new DocumentCollection(name, options);
    this.collections.set(name, collection);

    return collection;
  }

  /**
   * List all collection names
   */
  async listCollections(): Promise<string[]> {
    return Array.from(this.collections.keys());
  }

  /**
   * Drop a collection
   */
  async dropCollection(name: string): Promise<boolean> {
    return this.collections.delete(name);
  }
}
