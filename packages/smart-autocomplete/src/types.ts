/**
 * Smart Autocomplete Types
 * Context-aware autocomplete for SQL/Cypher/GraphQL
 */

export interface DatabaseSchema {
  tables: Table[];
  relationships?: Relationship[];
}

export interface Table {
  name: string;
  columns: Column[];
  primaryKey?: string[];
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  unique?: boolean;
}

export interface Relationship {
  fromTable: string;
  toTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  foreignKey: string;
}

export type QueryLanguage = 'sql' | 'cypher' | 'graphql';

export interface AutocompleteSuggestion {
  label: string;           // What to show (e.g., "users")
  insertText: string;      // What to insert (e.g., "users ")
  kind: SuggestionKind;    // Type of suggestion
  detail?: string;         // Additional info (e.g., "Table")
  documentation?: string;  // Description
  sortText?: string;       // For custom ordering
}

export type SuggestionKind =
  | 'keyword'      // SQL/Cypher keywords (SELECT, WHERE, etc.)
  | 'table'        // Table names
  | 'column'       // Column names
  | 'function'     // Built-in functions (COUNT, SUM, etc.)
  | 'operator'     // Operators (=, >, <, etc.)
  | 'alias';       // Table aliases

export interface AutocompleteContext {
  query: string;           // Current query text
  position: number;        // Cursor position
  language: QueryLanguage; // SQL, Cypher, GraphQL
}

export interface ParsedContext {
  currentToken: string;    // Token at cursor
  previousToken: string;   // Previous token
  tokenBeforePrevious?: string; // Token before previous
  tables: string[];        // Tables in query
  aliases: Map<string, string>;  // Alias → Table mapping
  inSelectClause: boolean;
  inFromClause: boolean;
  inWhereClause: boolean;
  inJoinClause: boolean;
}
