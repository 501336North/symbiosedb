/**
 * Mock VS Code API for testing
 */

export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
  Folder = 18,
  EnumMember = 19,
  Constant = 20,
  Struct = 21,
  Event = 22,
  Operator = 23,
  TypeParameter = 24,
}

export class MarkdownString {
  constructor(public value?: string) {}
}

export class SnippetString {
  constructor(public value?: string) {}
}

export class CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string | MarkdownString;
  insertText?: string | SnippetString;
  sortText?: string;

  constructor(label: string, kind?: CompletionItemKind) {
    this.label = label;
    this.kind = kind || CompletionItemKind.Text;
  }
}

export class Position {
  constructor(
    public line: number,
    public character: number
  ) {}
}

export class Range {
  constructor(
    public start: Position,
    public end: Position
  ) {}
}

export interface TextDocument {
  uri: any;
  fileName: string;
  languageId: string;
  version: number;
  getText(): string;
  lineAt(position: number | Position): any;
}

export interface CancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested: any;
}

export interface CompletionContext {
  triggerKind: number;
  triggerCharacter?: string;
}

export interface CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext
  ): any;
}

export const languages = {
  registerCompletionItemProvider: jest.fn(),
  registerHoverProvider: jest.fn(),
};

export const window = {
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    show: jest.fn(),
  })),
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
  })),
  onDidChangeConfiguration: jest.fn(),
  workspaceFolders: [],
};

export const commands = {
  registerCommand: jest.fn(),
};
