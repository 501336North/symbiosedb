/**
 * SymbioseDB Hover Provider
 * Provides documentation tooltips on hover
 */

import * as vscode from 'vscode';

export class SymbioseDBHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);

    // Check if it's a SymbioseDB method
    const methodDocs = this.getMethodDocumentation(word);
    if (methodDocs) {
      return new vscode.Hover(methodDocs);
    }

    // Check if it's a SQL keyword
    const sqlDocs = this.getSQLDocumentation(word);
    if (sqlDocs) {
      return new vscode.Hover(sqlDocs);
    }

    // Check if it's a Cypher keyword
    const cypherDocs = this.getCypherDocumentation(word);
    if (cypherDocs) {
      return new vscode.Hover(cypherDocs);
    }

    return null;
  }

  private getMethodDocumentation(method: string): vscode.MarkdownString | null {
    const docs: { [key: string]: vscode.MarkdownString } = {
      query: new vscode.MarkdownString(
        '**SymbioseDB Query Method**\n\nExecute a unified query with intelligent routing to the appropriate database.\n\n```typescript\nawait symbiosedb.query({\n  type: \'sql\' | \'cypher\' | \'vector\' | \'blockchain\',\n  query: string,\n  params?: any[]\n});\n```\n\n**Returns:** `Promise<QueryResult>`'
      ),
      sql: new vscode.MarkdownString(
        '**Execute SQL Query**\n\nExecute a SQL query directly on the PostgreSQL database.\n\n```typescript\nawait symbiosedb.sql(\n  query: string,\n  params?: any[]\n): Promise<SQLResult>\n```\n\n**Example:**\n```typescript\nconst users = await symbiosedb.sql(\n  \'SELECT * FROM users WHERE id = $1\',\n  [userId]\n);\n```'
      ),
      vectorSearch: new vscode.MarkdownString(
        '**Vector Similarity Search**\n\nPerform semantic search using pgvector.\n\n```typescript\nawait symbiosedb.vectorSearch({\n  embedding: number[],\n  limit?: number,\n  threshold?: number,\n  metadata?: object\n}): Promise<VectorResult[]>\n```\n\n**Example:**\n```typescript\nconst similar = await symbiosedb.vectorSearch({\n  embedding: [0.1, 0.2, 0.3, 0.4],\n  limit: 10,\n  threshold: 0.8\n});\n```'
      ),
      cypher: new vscode.MarkdownString(
        '**Execute Cypher Query**\n\nExecute a graph query using Apache AGE (Cypher syntax).\n\n```typescript\nawait symbiosedb.cypher(\n  query: string,\n  params?: object\n): Promise<GraphResult>\n```\n\n**Example:**\n```typescript\nconst users = await symbiosedb.cypher(\n  \'MATCH (n:User) RETURN n LIMIT 10\'\n);\n```'
      ),
      attest: new vscode.MarkdownString(
        '**Blockchain Attestation**\n\nCreate an immutable blockchain attestation on Ethereum L2.\n\n```typescript\nawait symbiosedb.attest({\n  action: string,\n  data: object\n}): Promise<AttestationResult>\n```\n\n**Example:**\n```typescript\nconst attestation = await symbiosedb.attest({\n  action: \'USER_CREATED\',\n  data: { userId: \'123\', timestamp: Date.now() }\n});\n```'
      ),
      connect: new vscode.MarkdownString(
        '**Connect to SymbioseDB**\n\nEstablish a connection to the SymbioseDB API.\n\n```typescript\nawait symbiosedb.connect({\n  apiUrl: string,\n  apiKey?: string\n}): Promise<ConnectionResult>\n```\n\n**Example:**\n```typescript\nawait symbiosedb.connect({\n  apiUrl: \'http://localhost:3000\',\n  apiKey: process.env.SYMBIOSEDB_API_KEY\n});\n```'
      ),
      indexDocument: new vscode.MarkdownString(
        '**RAG: Index Document**\n\nIndex a document for retrieval-augmented generation.\n\n```typescript\nawait symbiosedb.rag.indexDocument({\n  content: string,\n  metadata?: object,\n  chunkSize?: number\n}): Promise<IndexResult>\n```\n\n**Example:**\n```typescript\nawait symbiosedb.rag.indexDocument({\n  content: documentText,\n  metadata: { title: \'Doc 1\', author: \'Alice\' },\n  chunkSize: 500\n});\n```'
      )
    };

    const doc = docs[method];
    if (doc) {
      doc.isTrusted = true;
      doc.supportHtml = true;
    }
    return doc || null;
  }

  private getSQLDocumentation(keyword: string): vscode.MarkdownString | null {
    const upperKeyword = keyword.toUpperCase();

    const docs: { [key: string]: string } = {
      SELECT: '**SELECT** - Retrieve data from database tables\n\n```sql\nSELECT column1, column2 FROM table_name WHERE condition;\n```',
      INSERT: '**INSERT** - Add new rows to a table\n\n```sql\nINSERT INTO table_name (column1, column2) VALUES (value1, value2);\n```',
      UPDATE: '**UPDATE** - Modify existing data\n\n```sql\nUPDATE table_name SET column1 = value1 WHERE condition;\n```',
      DELETE: '**DELETE** - Remove rows from a table\n\n```sql\nDELETE FROM table_name WHERE condition;\n```',
      JOIN: '**JOIN** - Combine rows from multiple tables\n\n```sql\nSELECT * FROM table1 JOIN table2 ON table1.id = table2.foreign_id;\n```',
      WHERE: '**WHERE** - Filter results based on conditions\n\n```sql\nSELECT * FROM users WHERE age > 18 AND country = \'US\';\n```',
      'GROUP BY': '**GROUP BY** - Group rows with same values\n\n```sql\nSELECT country, COUNT(*) FROM users GROUP BY country;\n```',
      'ORDER BY': '**ORDER BY** - Sort result set\n\n```sql\nSELECT * FROM users ORDER BY created_at DESC;\n```',
      LIMIT: '**LIMIT** - Restrict number of rows returned\n\n```sql\nSELECT * FROM users LIMIT 10;\n```'
    };

    const doc = docs[upperKeyword];
    if (doc) {
      const markdown = new vscode.MarkdownString(doc);
      markdown.isTrusted = true;
      return markdown;
    }

    return null;
  }

  private getCypherDocumentation(keyword: string): vscode.MarkdownString | null {
    const upperKeyword = keyword.toUpperCase();

    const docs: { [key: string]: string } = {
      MATCH: '**MATCH** - Find patterns in the graph\n\n```cypher\nMATCH (n:User) RETURN n;\nMATCH (a)-[r:FOLLOWS]->(b) RETURN a, r, b;\n```',
      CREATE: '**CREATE** - Create nodes and relationships\n\n```cypher\nCREATE (n:Person {name: \'Alice\', age: 30});\nCREATE (a)-[r:KNOWS]->(b);\n```',
      MERGE: '**MERGE** - Create if doesn\'t exist, otherwise match\n\n```cypher\nMERGE (n:User {email: \'alice@example.com\'})\nON CREATE SET n.created = timestamp();\n```',
      RETURN: '**RETURN** - Specify what to return from query\n\n```cypher\nMATCH (n:User) RETURN n.name, n.age ORDER BY n.age;\n```',
      WHERE: '**WHERE** - Filter matched patterns\n\n```cypher\nMATCH (n:User) WHERE n.age > 18 AND n.country = \'US\' RETURN n;\n```',
      DELETE: '**DELETE** - Delete nodes and relationships\n\n```cypher\nMATCH (n:User {name: \'Alice\'}) DETACH DELETE n;\n```',
      SET: '**SET** - Update properties\n\n```cypher\nMATCH (n:User {name: \'Alice\'}) SET n.age = 31;\n```',
      WITH: '**WITH** - Chain query parts and pass results\n\n```cypher\nMATCH (u:User) WITH u ORDER BY u.age DESC LIMIT 10 RETURN u;\n```'
    };

    const doc = docs[upperKeyword];
    if (doc) {
      const markdown = new vscode.MarkdownString(doc);
      markdown.isTrusted = true;
      return markdown;
    }

    return null;
  }
}
