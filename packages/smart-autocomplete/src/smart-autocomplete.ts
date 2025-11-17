/**
 * Smart Autocomplete
 * Context-aware autocomplete for SQL/Cypher/GraphQL with schema awareness
 */

import {
  DatabaseSchema,
  AutocompleteSuggestion,
  AutocompleteContext,
  ParsedContext,
  SuggestionKind,
} from './types';

export class SmartAutocomplete {
  private schema: DatabaseSchema;

  // SQL keywords
  private sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER',
    'ON', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
    'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'AS', 'DISTINCT',
    '*',
  ];

  // SQL functions
  private sqlFunctions = [
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'UPPER', 'LOWER', 'TRIM', 'LENGTH', 'SUBSTRING',
    'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY',
  ];

  // SQL operators
  private sqlOperators = ['=', '>', '<', '>=', '<=', '!=', '<>', 'LIKE', 'IN', 'BETWEEN'];

  // Cypher keywords
  private cypherKeywords = [
    'MATCH', 'WHERE', 'RETURN', 'CREATE', 'DELETE', 'SET',
    'WITH', 'ORDER BY', 'LIMIT', 'SKIP',
  ];

  // GraphQL keywords
  private graphqlKeywords = ['query', 'mutation', 'subscription', 'fragment', 'on'];

  constructor(schema: DatabaseSchema) {
    this.schema = schema;
  }

  /**
   * Get autocomplete suggestions based on context
   */
  getSuggestions(context: AutocompleteContext): AutocompleteSuggestion[] {
    const parsed = this.parseContext(context);
    const suggestions: AutocompleteSuggestion[] = [];

    // Check if we're completing after a dot (table.column)
    const dotMatch = parsed.currentToken.match(/^(\w+)\.(\w*)$/);
    let filterToken = parsed.currentToken;

    if (dotMatch) {
      // Extract table/alias and partial column name
      const tableOrAlias = dotMatch[1];
      filterToken = dotMatch[2]; // Part after dot for filtering

      // Resolve alias to table name
      let tableName = tableOrAlias;
      if (parsed.aliases.has(tableOrAlias)) {
        tableName = parsed.aliases.get(tableOrAlias)!;
      }

      // Check if table exists in schema
      const tableExists = this.schema.tables.some(t => t.name === tableName);
      if (tableExists || parsed.aliases.has(tableOrAlias)) {
        suggestions.push(...this.getColumnSuggestions([tableName]));
        return this.filterSuggestions(suggestions, filterToken);
      }
    }

    switch (context.language) {
      case 'sql':
        suggestions.push(...this.getSQLSuggestions(parsed));
        break;
      case 'cypher': {
        const cypherSuggestions = this.getCypherSuggestions(parsed);
        // If Cypher returned table suggestions after ':', don't filter
        if (cypherSuggestions.length > 0 && parsed.currentToken.includes(':')) {
          return cypherSuggestions;
        }
        suggestions.push(...cypherSuggestions);
        break;
      }
      case 'graphql': {
        const graphqlSuggestions = this.getGraphQLSuggestions(parsed);
        // If GraphQL returned column suggestions, don't filter
        if (graphqlSuggestions.length > 0 && graphqlSuggestions[0].kind === 'column') {
          return graphqlSuggestions;
        }
        suggestions.push(...graphqlSuggestions);
        break;
      }
    }

    // Filter by current token
    return this.filterSuggestions(suggestions, filterToken);
  }

  /**
   * Parse query context to understand current position
   */
  parseContext(context: AutocompleteContext): ParsedContext {
    const { query, position } = context;
    const textBeforeCursor = query.substring(0, position);
    const tokens = textBeforeCursor.split(/\s+/);

    const currentToken = tokens[tokens.length - 1] || '';
    const previousToken = tokens[tokens.length - 2] || '';
    const tokenBeforePrevious = tokens[tokens.length - 3] || '';

    const upperQuery = textBeforeCursor.toUpperCase();

    // Detect clauses
    const selectIndex = upperQuery.lastIndexOf('SELECT');
    const fromIndex = upperQuery.lastIndexOf('FROM');
    const whereIndex = upperQuery.lastIndexOf('WHERE');
    const joinIndex = upperQuery.lastIndexOf('JOIN');

    const inSelectClause = selectIndex > fromIndex && selectIndex !== -1;
    const inFromClause = fromIndex > selectIndex && fromIndex > whereIndex;
    const inWhereClause = whereIndex > fromIndex && whereIndex !== -1;
    const inJoinClause = joinIndex > fromIndex && joinIndex !== -1;

    // Parse table aliases
    const aliases = new Map<string, string>();
    const aliasRegex = /FROM\s+(\w+)\s+(\w+)|JOIN\s+(\w+)\s+(\w+)/gi;
    let match;
    while ((match = aliasRegex.exec(query)) !== null) {
      if (match[1] && match[2]) {
        aliases.set(match[2], match[1]);
      }
      if (match[3] && match[4]) {
        aliases.set(match[4], match[3]);
      }
    }

    // Detect tables in query
    const tables: string[] = [];
    const fromRegex = /FROM\s+(\w+)/gi;
    while ((match = fromRegex.exec(query)) !== null) {
      tables.push(match[1]);
    }

    return {
      currentToken,
      previousToken,
      tokenBeforePrevious,
      tables,
      aliases,
      inSelectClause,
      inFromClause,
      inWhereClause,
      inJoinClause,
    };
  }

  /**
   * Get SQL-specific suggestions
   */
  private getSQLSuggestions(context: ParsedContext): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = [];

    // Suggest keywords
    if (context.previousToken.toUpperCase() === 'SELECT') {
      suggestions.push(...this.getKeywordSuggestions(['*']));
    } else if (context.previousToken.toUpperCase() === 'FROM' || context.inFromClause) {
      suggestions.push(...this.getTableSuggestions());
    } else if (context.previousToken.toUpperCase() === 'JOIN' || context.inJoinClause) {
      suggestions.push(...this.getTableSuggestions());
    } else if (context.previousToken.toUpperCase() === 'INNER') {
      suggestions.push(...this.getKeywordSuggestions(['JOIN']));
    } else if (context.inWhereClause) {
      suggestions.push(...this.getColumnSuggestions(context.tables));
      suggestions.push(...this.getOperatorSuggestions());
    } else {
      suggestions.push(...this.getKeywordSuggestions(this.sqlKeywords));
    }


    // After FROM clause, suggest WHERE, JOIN, ORDER BY
    if (context.tables.length > 0 && !context.inWhereClause && !context.inJoinClause) {
      suggestions.push(...this.getKeywordSuggestions(['WHERE', 'JOIN', 'ORDER BY', 'LIMIT']));
    }

    // Suggest functions
    suggestions.push(...this.getFunctionSuggestions());

    return suggestions;
  }

  /**
   * Get Cypher-specific suggestions
   */
  private getCypherSuggestions(context: ParsedContext): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = [];

    // After node label colon (e.g., "MATCH (u:" where token contains ":")
    if (context.currentToken.includes(':') || context.previousToken === ':') {
      return this.getTableSuggestions(); // Return immediately without filtering
    }

    suggestions.push(...this.getKeywordSuggestions(this.cypherKeywords));

    return suggestions;
  }

  /**
   * Get GraphQL-specific suggestions
   */
  private getGraphQLSuggestions(context: ParsedContext): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = [];

    // Check if previous token is a table name
    // E.g., "query { users { " where tokenBeforePrevious is "users", previousToken is "{"
    const prevToken = context.previousToken;
    const tokenBeforePrev = context.tokenBeforePrevious || '';

    const tableExistsPrev = this.schema.tables.some(t => t.name === prevToken);
    const tableExistsBeforePrev = this.schema.tables.some(t => t.name === tokenBeforePrev);

    if (tableExistsPrev) {
      return this.getColumnSuggestions([prevToken]); // Return columns immediately
    }

    if (tableExistsBeforePrev && prevToken === '{') {
      return this.getColumnSuggestions([tokenBeforePrev]); // Return columns for table before '{'
    }

    suggestions.push(...this.getKeywordSuggestions(this.graphqlKeywords));

    // Suggest type names
    if (prevToken === '{' || context.currentToken === '' || context.currentToken === '{') {
      suggestions.push(...this.getTableSuggestions());
    }

    return suggestions;
  }

  /**
   * Get keyword suggestions
   */
  private getKeywordSuggestions(keywords: string[]): AutocompleteSuggestion[] {
    return keywords.map((keyword) => ({
      label: keyword,
      insertText: keyword + ' ',
      kind: 'keyword' as SuggestionKind,
      detail: 'Keyword',
    }));
  }

  /**
   * Get table suggestions
   */
  private getTableSuggestions(): AutocompleteSuggestion[] {
    return this.schema.tables.map((table) => ({
      label: table.name,
      insertText: table.name + ' ',
      kind: 'table' as SuggestionKind,
      detail: 'Table',
      documentation: `${table.columns.length} columns`,
    }));
  }

  /**
   * Get column suggestions for specific tables
   */
  private getColumnSuggestions(tableNames: string[]): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = [];

    this.schema.tables
      .filter((table) => tableNames.length === 0 || tableNames.includes(table.name))
      .forEach((table) => {
        table.columns.forEach((column) => {
          suggestions.push({
            label: column.name,
            insertText: column.name + ' ',
            kind: 'column' as SuggestionKind,
            detail: `${table.name}.${column.name}`,
            documentation: column.type,
          });
        });
      });

    return suggestions;
  }

  /**
   * Get function suggestions
   */
  private getFunctionSuggestions(): AutocompleteSuggestion[] {
    return this.sqlFunctions.map((func) => ({
      label: func,
      insertText: func + '(',
      kind: 'function' as SuggestionKind,
      detail: 'Function',
    }));
  }

  /**
   * Get operator suggestions
   */
  private getOperatorSuggestions(): AutocompleteSuggestion[] {
    return this.sqlOperators.map((op) => ({
      label: op,
      insertText: op + ' ',
      kind: 'operator' as SuggestionKind,
      detail: 'Operator',
    }));
  }

  /**
   * Filter suggestions by current token
   */
  private filterSuggestions(
    suggestions: AutocompleteSuggestion[],
    currentToken: string
  ): AutocompleteSuggestion[] {
    if (!currentToken || currentToken.trim() === '') {
      return suggestions;
    }

    const lowerToken = currentToken.toLowerCase();
    return suggestions.filter((s) => s.label.toLowerCase().includes(lowerToken));
  }
}
