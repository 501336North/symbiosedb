/**
 * @symbiosedb/document-api - MongoDB-style document API on PostgreSQL JSONB
 * NoSQL developer experience with SQL reliability
 */

export { DocumentAPI } from './document-api';
export { DocumentCollection } from './document-collection';

export type {
  Document,
  QueryOperators,
  QueryFilter,
  SortDirection,
  SortSpec,
  FindOptions,
  InsertResult,
  UpdateResult,
  DeleteResult,
  CollectionOptions,
  IDocumentCollection,
  IDocumentAPI,
} from './types';
