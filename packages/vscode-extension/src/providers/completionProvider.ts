/**
 * SymbioseDB Completion Provider
 * Provides IntelliSense for SymbioseDB SDK methods and SQL/Cypher keywords
 */

import * as vscode from 'vscode';

export class SymbioseDBCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const linePrefix = document.lineAt(position).text.substr(0, position.character);

    // Check if we're in a SymbioseDB SDK context
    if (this.isSymbioseDBContext(linePrefix)) {
      return this.getSymbioseDBCompletions();
    }

    // Check if we're in a SQL context
    if (this.isSQLContext(document, position)) {
      return this.getSQLCompletions();
    }

    // Check if we're in a Cypher context
    if (this.isCypherContext(document, position)) {
      return this.getCypherCompletions();
    }

    return [];
  }

  private isSymbioseDBContext(linePrefix: string): boolean {
    return linePrefix.includes('symbiosedb.') || linePrefix.includes('SymbioseDB.');
  }

  private isSQLContext(document: vscode.TextDocument, position: vscode.Position): boolean {
    const text = document.getText();
    const ext = document.fileName.split('.').pop();

    // Check file extension or if we're in a SQL string
    return ext === 'sql' || text.includes('SELECT') || text.includes('INSERT') || text.includes('UPDATE');
  }

  private isCypherContext(document: vscode.TextDocument, position: vscode.Position): boolean {
    const text = document.getText();
    const ext = document.fileName.split('.').pop();

    // Check file extension or if we're in a Cypher query
    return ext === 'cypher' || text.includes('MATCH') || text.includes('CREATE') || text.includes('RETURN');
  }

  private getSymbioseDBCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // Query methods
    const queryMethod = new vscode.CompletionItem('query', vscode.CompletionItemKind.Method);
    queryMethod.detail = 'Execute a unified query across databases';
    queryMethod.documentation = new vscode.MarkdownString(
      'Execute a query with intelligent routing to the appropriate database.\n\n```typescript\nawait symbiosedb.query({\n  type: \'sql\',\n  query: \'SELECT * FROM users\'\n});\n```'
    );
    queryMethod.insertText = new vscode.SnippetString('query({\n\ttype: \'${1|sql,cypher,vector,blockchain|}\',\n\tquery: \'${2:SELECT * FROM users}\'\n})');
    completions.push(queryMethod);

    // SQL method
    const sqlMethod = new vscode.CompletionItem('sql', vscode.CompletionItemKind.Method);
    sqlMethod.detail = 'Execute a SQL query on PostgreSQL';
    sqlMethod.documentation = new vscode.MarkdownString(
      'Execute a SQL query directly on the PostgreSQL database.\n\n```typescript\nawait symbiosedb.sql(\'SELECT * FROM users WHERE id = $1\', [userId]);\n```'
    );
    sqlMethod.insertText = new vscode.SnippetString('sql(\'${1:SELECT * FROM users}\', [${2:}])');
    completions.push(sqlMethod);

    // Vector search method
    const vectorMethod = new vscode.CompletionItem('vectorSearch', vscode.CompletionItemKind.Method);
    vectorMethod.detail = 'Perform vector similarity search';
    vectorMethod.documentation = new vscode.MarkdownString(
      'Search for similar vectors using pgvector.\n\n```typescript\nawait symbiosedb.vectorSearch({\n  embedding: [0.1, 0.2, 0.3],\n  limit: 10,\n  threshold: 0.8\n});\n```'
    );
    vectorMethod.insertText = new vscode.SnippetString('vectorSearch({\n\tembedding: [${1:0.1, 0.2, 0.3}],\n\tlimit: ${2:10},\n\tthreshold: ${3:0.8}\n})');
    completions.push(vectorMethod);

    // Graph query method
    const graphMethod = new vscode.CompletionItem('cypher', vscode.CompletionItemKind.Method);
    graphMethod.detail = 'Execute a Cypher query on Apache AGE';
    graphMethod.documentation = new vscode.MarkdownString(
      'Execute a graph query using Cypher syntax.\n\n```typescript\nawait symbiosedb.cypher(\'MATCH (n:User) RETURN n LIMIT 10\');\n```'
    );
    graphMethod.insertText = new vscode.SnippetString('cypher(\'${1:MATCH (n) RETURN n}\')');
    completions.push(graphMethod);

    // Blockchain attestation
    const attestMethod = new vscode.CompletionItem('attest', vscode.CompletionItemKind.Method);
    attestMethod.detail = 'Store a blockchain attestation';
    attestMethod.documentation = new vscode.MarkdownString(
      'Create an immutable blockchain attestation.\n\n```typescript\nawait symbiosedb.attest({\n  action: \'USER_CREATED\',\n  data: { userId, timestamp }\n});\n```'
    );
    attestMethod.insertText = new vscode.SnippetString('attest({\n\taction: \'${1:USER_CREATED}\',\n\tdata: {${2:}}\n})');
    completions.push(attestMethod);

    // RAG methods
    const ragIndexMethod = new vscode.CompletionItem('rag.indexDocument', vscode.CompletionItemKind.Method);
    ragIndexMethod.detail = 'Index a document for RAG';
    ragIndexMethod.documentation = new vscode.MarkdownString(
      'Index a document for retrieval-augmented generation.\n\n```typescript\nawait symbiosedb.rag.indexDocument({\n  content: documentText,\n  metadata: { title, author }\n});\n```'
    );
    ragIndexMethod.insertText = new vscode.SnippetString('rag.indexDocument({\n\tcontent: \'${1:document text}\',\n\tmetadata: {${2:}}\n})');
    completions.push(ragIndexMethod);

    const ragQueryMethod = new vscode.CompletionItem('rag.query', vscode.CompletionItemKind.Method);
    ragQueryMethod.detail = 'Query the RAG system';
    ragQueryMethod.documentation = new vscode.MarkdownString(
      'Query indexed documents using semantic search.\n\n```typescript\nawait symbiosedb.rag.query(\'What is the meaning of life?\');\n```'
    );
    ragQueryMethod.insertText = new vscode.SnippetString('rag.query(\'${1:Your question}\')');
    completions.push(ragQueryMethod);

    // Connection methods
    const connectMethod = new vscode.CompletionItem('connect', vscode.CompletionItemKind.Method);
    connectMethod.detail = 'Connect to SymbioseDB';
    connectMethod.documentation = new vscode.MarkdownString(
      'Establish a connection to the SymbioseDB API.\n\n```typescript\nawait symbiosedb.connect({\n  apiUrl: \'http://localhost:3000\',\n  apiKey: process.env.SYMBIOSEDB_API_KEY\n});\n```'
    );
    connectMethod.insertText = new vscode.SnippetString('connect({\n\tapiUrl: \'${1:http://localhost:3000}\',\n\tapiKey: ${2:process.env.SYMBIOSEDB_API_KEY}\n})');
    completions.push(connectMethod);

    return completions;
  }

  private getSQLCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // SQL Keywords
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'FULL JOIN', 'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
      'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
      'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
      'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'ADD COLUMN', 'DROP COLUMN',
      'CREATE INDEX', 'DROP INDEX', 'TRUNCATE', 'DISTINCT', 'AS', 'UNION'
    ];

    keywords.forEach(keyword => {
      const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
      item.detail = 'SQL Keyword';
      item.insertText = keyword;
      completions.push(item);
    });

    // SQL Functions
    const functions = [
      { name: 'COUNT', detail: 'Count rows', snippet: 'COUNT(${1:*})' },
      { name: 'SUM', detail: 'Sum values', snippet: 'SUM(${1:column})' },
      { name: 'AVG', detail: 'Average values', snippet: 'AVG(${1:column})' },
      { name: 'MAX', detail: 'Maximum value', snippet: 'MAX(${1:column})' },
      { name: 'MIN', detail: 'Minimum value', snippet: 'MIN(${1:column})' },
      { name: 'CONCAT', detail: 'Concatenate strings', snippet: 'CONCAT(${1:str1}, ${2:str2})' },
      { name: 'UPPER', detail: 'Convert to uppercase', snippet: 'UPPER(${1:column})' },
      { name: 'LOWER', detail: 'Convert to lowercase', snippet: 'LOWER(${1:column})' },
      { name: 'COALESCE', detail: 'Return first non-null value', snippet: 'COALESCE(${1:column}, ${2:default})' },
      { name: 'NOW', detail: 'Current timestamp', snippet: 'NOW()' }
    ];

    functions.forEach(func => {
      const item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function);
      item.detail = func.detail;
      item.insertText = new vscode.SnippetString(func.snippet);
      completions.push(item);
    });

    return completions;
  }

  private getCypherCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // Cypher Keywords
    const keywords = [
      'MATCH', 'CREATE', 'MERGE', 'DELETE', 'REMOVE', 'SET',
      'RETURN', 'WITH', 'WHERE', 'AND', 'OR', 'NOT',
      'ORDER BY', 'LIMIT', 'SKIP', 'UNWIND', 'FOREACH',
      'CALL', 'YIELD', 'UNION', 'OPTIONAL MATCH'
    ];

    keywords.forEach(keyword => {
      const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
      item.detail = 'Cypher Keyword';
      item.insertText = keyword;
      completions.push(item);
    });

    // Cypher Patterns
    const patterns = [
      { name: '(node)', detail: 'Node pattern', snippet: '(${1:n}:${2:Label})' },
      { name: '-[rel]->', detail: 'Relationship pattern', snippet: '-[${1:r}:${2:RELATES_TO}]->' },
      { name: 'shortestPath', detail: 'Shortest path', snippet: 'shortestPath((${1:start})-[*]-(${2:end}))' },
      { name: 'allShortestPaths', detail: 'All shortest paths', snippet: 'allShortestPaths((${1:start})-[*]-(${2:end}))' }
    ];

    patterns.forEach(pattern => {
      const item = new vscode.CompletionItem(pattern.name, vscode.CompletionItemKind.Snippet);
      item.detail = pattern.detail;
      item.insertText = new vscode.SnippetString(pattern.snippet);
      completions.push(item);
    });

    // Cypher Functions
    const functions = [
      { name: 'count', detail: 'Count items', snippet: 'count(${1:n})' },
      { name: 'collect', detail: 'Collect into list', snippet: 'collect(${1:n})' },
      { name: 'length', detail: 'Length of path', snippet: 'length(${1:path})' },
      { name: 'nodes', detail: 'Get nodes from path', snippet: 'nodes(${1:path})' },
      { name: 'relationships', detail: 'Get relationships from path', snippet: 'relationships(${1:path})' },
      { name: 'properties', detail: 'Get node properties', snippet: 'properties(${1:n})' }
    ];

    functions.forEach(func => {
      const item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function);
      item.detail = func.detail;
      item.insertText = new vscode.SnippetString(func.snippet);
      completions.push(item);
    });

    return completions;
  }
}
