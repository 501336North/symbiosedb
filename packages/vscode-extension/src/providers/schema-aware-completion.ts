/**
 * Schema-Aware Autocomplete Provider
 *
 * Provides intelligent autocomplete based on actual database schema
 */

import type { TableSchema, ColumnSchema } from '@symbiosedb/magical-migrations';

export interface CompletionItem {
  label: string;
  kind: 'Table' | 'Column' | 'Keyword' | 'Snippet' | 'Function';
  detail?: string;
  insertText: string;
  documentation?: string;
  sortText?: string;
}

export interface CompletionContext {
  currentTable?: string;
}

/**
 * Schema-Aware Completion Provider
 *
 * Provides autocomplete suggestions based on parsed TypeScript schema
 */
export class SchemaAwareCompletionProvider {
  private schemas: TableSchema[];
  private tableMap: Map<string, TableSchema>;

  constructor(schemas: TableSchema[]) {
    this.schemas = schemas;
    this.tableMap = new Map(schemas.map(s => [s.tableName, s]));
  }

  /**
   * Update the schema (when TypeScript files change)
   */
  updateSchema(schemas: TableSchema[]): void {
    this.schemas = schemas;
    this.tableMap = new Map(schemas.map(s => [s.tableName, s]));
  }

  /**
   * Get completions for current cursor position
   */
  getCompletions(
    query: string,
    position: number,
    context?: CompletionContext
  ): CompletionItem[] {
    const textBeforeCursor = query.substring(0, position);
    const lastWord = this.getLastWord(textBeforeCursor);

    // Detect context
    const queryContext = this.analyzeContext(textBeforeCursor);

    // Check for table.column notation
    if (textBeforeCursor.endsWith('.')) {
      return this.getColumnCompletionsAfterDot(textBeforeCursor);
    }

    // Suggest tables after FROM/JOIN
    if (queryContext.expectsTable) {
      return this.getTableCompletions(lastWord);
    }

    // Suggest columns after SELECT/WHERE
    if (queryContext.expectsColumn) {
      return this.getColumnCompletions(
        textBeforeCursor,
        lastWord,
        context
      );
    }

    // Suggest JOIN clauses
    if (queryContext.expectsJoin) {
      return this.getJoinCompletions(textBeforeCursor);
    }

    // Suggest complete JOIN statements after FROM table
    if (queryContext.afterFromTable) {
      return this.getJoinCompletions(textBeforeCursor);
    }

    return [];
  }

  /**
   * Get query templates for a table
   */
  getQueryTemplates(context?: CompletionContext): CompletionItem[] {
    if (!context?.currentTable) {
      return [];
    }

    const table = this.tableMap.get(context.currentTable);
    if (!table) {
      return [];
    }

    const templates: CompletionItem[] = [];

    // SELECT template
    templates.push({
      label: `Select all ${context.currentTable}`,
      kind: 'Snippet',
      insertText: `SELECT * FROM ${context.currentTable} LIMIT 10;`,
      detail: 'Select all rows with limit',
    });

    // INSERT template - include all columns (UUIDs need to be provided)
    const columnList = table.columns.map(c => c.name).join(', ');
    const valuePlaceholders = table.columns.map((_, i) => `$${i + 1}`).join(', ');

    templates.push({
      label: `Insert ${context.currentTable.slice(0, -1)}`,
      kind: 'Snippet',
      insertText: `INSERT INTO ${context.currentTable} (${columnList})\nVALUES (${valuePlaceholders});`,
      detail: 'Insert new row',
    });

    // UPDATE template
    const setClause = table.columns.map((c, i) => `${c.name} = $${i + 1}`).join(',\n  ');

    templates.push({
      label: `Update ${context.currentTable.slice(0, -1)}`,
      kind: 'Snippet',
      insertText: `UPDATE ${context.currentTable}\nSET ${setClause}\nWHERE id = $${table.columns.length + 1};`,
      detail: 'Update existing row',
    });

    // DELETE template
    templates.push({
      label: `Delete ${context.currentTable.slice(0, -1)}`,
      kind: 'Snippet',
      insertText: `DELETE FROM ${context.currentTable}\nWHERE id = $1;`,
      detail: 'Delete row by ID',
    });

    return templates;
  }

  /**
   * Get table completions
   */
  private getTableCompletions(prefix: string): CompletionItem[] {
    return this.schemas
      .filter(schema => schema.tableName.startsWith(prefix.toLowerCase()))
      .map(schema => ({
        label: schema.tableName,
        kind: 'Table' as const,
        detail: `Table with ${schema.columns.length} columns`,
        insertText: schema.tableName,
        sortText: `0_${schema.tableName}`,
      }));
  }

  /**
   * Get column completions
   */
  private getColumnCompletions(
    query: string,
    prefix: string,
    context?: CompletionContext
  ): CompletionItem[] {
    const tableAliases = this.extractTableAliases(query);
    const completions: CompletionItem[] = [];

    // If multiple tables, suggest alias.column format
    if (Object.keys(tableAliases).length > 1) {
      for (const [alias, tableName] of Object.entries(tableAliases)) {
        const table = this.tableMap.get(tableName);
        if (!table) continue;

        for (const column of table.columns) {
          if (column.name.startsWith(prefix.toLowerCase())) {
            completions.push(this.createColumnCompletion(
              column,
              `${alias}.${column.name}`,
              tableName
            ));
          }
        }
      }
    } else {
      // Single table, suggest column names directly
      const tables = Object.values(tableAliases);
      const tableName = tables[0] || context?.currentTable;
      if (!tableName) return completions;

      const table = this.tableMap.get(tableName);
      if (!table) return completions;

      for (const column of table.columns) {
        if (column.name.startsWith(prefix.toLowerCase())) {
          completions.push(this.createColumnCompletion(column, column.name));
        }
      }
    }

    return completions;
  }

  /**
   * Get column completions after dot notation (table.)
   */
  private getColumnCompletionsAfterDot(query: string): CompletionItem[] {
    const match = query.match(/(\w+)\.$/);
    if (!match) return [];

    const tableName = match[1];
    const table = this.tableMap.get(tableName);
    if (!table) return [];

    return table.columns.map(column =>
      this.createColumnCompletion(column, column.name)
    );
  }

  /**
   * Create column completion item
   */
  private createColumnCompletion(
    column: ColumnSchema,
    label: string,
    tableName?: string
  ): CompletionItem {
    const modifiers: string[] = [];

    if (column.isPrimaryKey) {
      modifiers.push('Primary Key');
    }
    if (column.isUnique) {
      modifiers.push('Unique');
    }
    if (column.isForeignKey) {
      modifiers.push(`FK → ${column.references?.table}.${column.references?.column}`);
    }

    // Format: "type" or "type (modifiers)"
    const detail = modifiers.length > 0
      ? `${column.type} (${modifiers.join(', ')})`
      : column.type;

    // Rank primary keys and indexed columns higher
    let sortText = '5_';
    if (column.isPrimaryKey) {
      sortText = '0_';
    } else if (column.isForeignKey) {
      sortText = '1_';
    } else if (column.isUnique) {
      sortText = '2_';
    }

    return {
      label,
      kind: 'Column',
      detail,
      insertText: label,
      sortText: `${sortText}${label}`,
    };
  }

  /**
   * Get JOIN completions
   */
  private getJoinCompletions(query: string): CompletionItem[] {
    const tableAliases = this.extractTableAliases(query);
    const completions: CompletionItem[] = [];

    // Find last table mentioned (last alias entry)
    const aliases = Object.entries(tableAliases);
    if (aliases.length === 0) return completions;

    const [lastAlias, lastTableName] = aliases[aliases.length - 1];
    const lastTableSchema = this.tableMap.get(lastTableName);
    if (!lastTableSchema) return completions;

    // Check if we have a JOIN keyword in the query (suggesting ON clause vs complete JOIN)
    const hasJoinKeyword = /\bJOIN\s+\w+(?:\s+\w+)?\s*$/i.test(query);

    if (hasJoinKeyword) {
      // Suggest ON clauses for existing JOIN
      for (const column of lastTableSchema.columns) {
        if (column.isForeignKey && column.references) {
          const referencedTable = column.references.table;
          const referencedColumn = column.references.column;

          // Find alias for referenced table if it exists
          const referencedAlias = Object.entries(tableAliases).find(
            ([, tableName]) => tableName === referencedTable
          )?.[0] || referencedTable;

          // Suggest JOIN clause using aliases (primary key = foreign key)
          completions.push({
            label: `ON ${referencedAlias}.${referencedColumn} = ${lastAlias}.${column.name}`,
            kind: 'Snippet',
            detail: 'Join on foreign key relationship',
            insertText: `ON ${referencedAlias}.${referencedColumn} = ${lastAlias}.${column.name}`,
            sortText: '0_fk_join',
          });
        }
      }
    } else {
      // Suggest complete JOIN statements
      // 1. Find tables that this table references via foreign keys
      for (const column of lastTableSchema.columns) {
        if (column.isForeignKey && column.references) {
          const referencedTable = column.references.table;
          const referencedColumn = column.references.column;

          // Don't suggest if already joined
          if (Object.values(tableAliases).includes(referencedTable)) {
            continue;
          }

          completions.push({
            label: `JOIN ${referencedTable} ON ${referencedTable}.${referencedColumn} = ${lastAlias}.${column.name}`,
            kind: 'Snippet',
            detail: `Join with related table ${referencedTable}`,
            insertText: `JOIN ${referencedTable} ON ${referencedTable}.${referencedColumn} = ${lastAlias}.${column.name}`,
            sortText: '0_fk_outgoing',
          });
        }
      }

      // 2. Find tables that have foreign keys TO this table
      for (const schema of this.schemas) {
        // Skip if already joined
        if (Object.values(tableAliases).includes(schema.tableName)) {
          continue;
        }

        for (const column of schema.columns) {
          if (
            column.isForeignKey &&
            column.references?.table === lastTableName
          ) {
            completions.push({
              label: `JOIN ${schema.tableName} ON ${lastAlias}.${column.references.column} = ${schema.tableName}.${column.name}`,
              kind: 'Snippet',
              detail: `Join with related table ${schema.tableName}`,
              insertText: `JOIN ${schema.tableName} ON ${lastAlias}.${column.references.column} = ${schema.tableName}.${column.name}`,
              sortText: '1_fk_incoming',
            });
          }
        }
      }
    }

    return completions;
  }

  /**
   * Analyze query context to determine what to suggest
   */
  private analyzeContext(query: string): {
    expectsTable: boolean;
    expectsColumn: boolean;
    expectsJoin: boolean;
    afterFromTable: boolean;
  } {
    const upperQuery = query.toUpperCase();

    // Expects table after FROM or JOIN
    const expectsTable =
      /\bFROM\s+$/i.test(query) ||
      /\bJOIN\s+$/i.test(query) ||
      /\bINNER\s+JOIN\s+$/i.test(query) ||
      /\bLEFT\s+JOIN\s+$/i.test(query);

    // Expects column after SELECT or WHERE (including partial typing)
    const expectsColumn =
      /\bSELECT\s+\w*$/i.test(query) ||      // SELECT or SELECT <partial>
      /\bWHERE\s+\w*$/i.test(query) ||       // WHERE or WHERE <partial>
      /\bAND\s+\w*$/i.test(query) ||         // AND or AND <partial>
      /\bOR\s+\w*$/i.test(query) ||          // OR or OR <partial>
      /,\s*\w*$/i.test(query);               // , or , <partial>

    // Expects JOIN condition
    const expectsJoin =
      /\bJOIN\s+\w+\s+$/i.test(query) ||
      /\bJOIN\s+\w+\s+\w+\s+$/i.test(query); // With alias

    // After FROM table (suggest complete JOIN statements)
    const afterFromTable =
      /\bFROM\s+\w+(?:\s+\w+)?\s+$/i.test(query) &&
      !/\bJOIN\b/i.test(query);

    return { expectsTable, expectsColumn, expectsJoin, afterFromTable };
  }

  /**
   * Extract table aliases from query
   * Returns map of alias -> tableName
   */
  private extractTableAliases(query: string): Record<string, string> {
    const aliases: Record<string, string> = {};

    // Match FROM table [alias]
    const fromMatch = query.match(/\bFROM\s+(\w+)(?:\s+(\w+))?/i);
    if (fromMatch) {
      const tableName = fromMatch[1].toLowerCase();
      const alias = fromMatch[2] ? fromMatch[2].toLowerCase() : tableName;
      aliases[alias] = tableName;
    }

    // Match JOIN table [alias]
    const joinMatches = query.matchAll(/\bJOIN\s+(\w+)(?:\s+(\w+))?/gi);
    for (const match of joinMatches) {
      const tableName = match[1].toLowerCase();
      const alias = match[2] ? match[2].toLowerCase() : tableName;
      aliases[alias] = tableName;
    }

    return aliases;
  }

  /**
   * Get last word before cursor
   */
  private getLastWord(text: string): string {
    const match = text.match(/(\w+)$/);
    return match ? match[1].toLowerCase() : '';
  }
}
