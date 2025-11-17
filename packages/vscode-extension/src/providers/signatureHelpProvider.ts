/**
 * SymbioseDB Signature Help Provider
 * Provides parameter hints for SymbioseDB methods
 */

import * as vscode from 'vscode';

export class SymbioseDBSignatureHelpProvider implements vscode.SignatureHelpProvider {
  provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.SignatureHelpContext
  ): vscode.ProviderResult<vscode.SignatureHelp> {
    const line = document.lineAt(position).text;
    const beforeCursor = line.substring(0, position.character);

    // Find which method we're in
    const methodMatch = beforeCursor.match(/(\w+)\s*\(/g);
    if (!methodMatch) {
      return null;
    }

    const lastMethod = methodMatch[methodMatch.length - 1].replace('(', '').trim();
    const signatureInfo = this.getSignatureInfo(lastMethod);

    if (!signatureInfo) {
      return null;
    }

    const signatureHelp = new vscode.SignatureHelp();
    signatureHelp.signatures = [signatureInfo];
    signatureHelp.activeSignature = 0;

    // Determine which parameter we're on
    const paramsText = beforeCursor.substring(beforeCursor.lastIndexOf('(') + 1);
    const commaCount = (paramsText.match(/,/g) || []).length;
    signatureHelp.activeParameter = commaCount;

    return signatureHelp;
  }

  private getSignatureInfo(method: string): vscode.SignatureInformation | null {
    const signatures: { [key: string]: { label: string; params: string[][]; doc: string } } = {
      query: {
        label: 'query(options: QueryOptions): Promise<QueryResult>',
        params: [
          ['options', 'Query configuration object with type, query, and optional params']
        ],
        doc: 'Execute a unified query with intelligent routing'
      },
      sql: {
        label: 'sql(query: string, params?: any[]): Promise<SQLResult>',
        params: [
          ['query', 'SQL query string with optional parameter placeholders ($1, $2, etc.)'],
          ['params', '(Optional) Array of parameter values to substitute']
        ],
        doc: 'Execute a SQL query on PostgreSQL'
      },
      vectorSearch: {
        label: 'vectorSearch(options: VectorSearchOptions): Promise<VectorResult[]>',
        params: [
          ['options', 'Search configuration with embedding, limit, threshold, and optional metadata']
        ],
        doc: 'Perform vector similarity search using pgvector'
      },
      cypher: {
        label: 'cypher(query: string, params?: object): Promise<GraphResult>',
        params: [
          ['query', 'Cypher query string'],
          ['params', '(Optional) Object with named parameters']
        ],
        doc: 'Execute a Cypher query on Apache AGE'
      },
      attest: {
        label: 'attest(options: AttestationOptions): Promise<AttestationResult>',
        params: [
          ['options', 'Attestation data with action and data fields']
        ],
        doc: 'Create an immutable blockchain attestation'
      },
      connect: {
        label: 'connect(options: ConnectionOptions): Promise<ConnectionResult>',
        params: [
          ['options', 'Connection configuration with apiUrl and optional apiKey']
        ],
        doc: 'Establish a connection to SymbioseDB'
      },
      indexDocument: {
        label: 'indexDocument(options: IndexOptions): Promise<IndexResult>',
        params: [
          ['options', 'Document configuration with content, metadata, and optional chunkSize']
        ],
        doc: 'Index a document for RAG'
      }
    };

    const sigInfo = signatures[method];
    if (!sigInfo) {
      return null;
    }

    const signature = new vscode.SignatureInformation(sigInfo.label, sigInfo.doc);
    signature.parameters = sigInfo.params.map(
      ([label, doc]) => new vscode.ParameterInformation(label, doc)
    );

    return signature;
  }
}
