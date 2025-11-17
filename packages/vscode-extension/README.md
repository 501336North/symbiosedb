# SymbioseDB VS Code Extension

AI-powered database development with all 5 DX features integrated.

## Features

- 🤖 **AI Query Assistant** (`Ctrl+Shift+A`) - Natural language to SQL
- ⚡ **Live Query Preview** (`Ctrl+Enter`) - Results as you type
- 🎨 **Schema Visualizer** - Interactive schema graph
- 🧠 **Smart Autocomplete** - Context-aware suggestions
- 📊 **Performance Hints** - Real-time query analysis

## Installation

1. Open VS Code
2. Install extension from marketplace (coming soon)
3. Configure connection string in settings

## Usage

### AI Query Assistant
Press `Ctrl+Shift+A` and type plain English:
- "show me all users"
- "users who signed up last week"
- "users with more than 5 orders"

### Live Query Preview
Type a query and press `Ctrl+Enter` to see results instantly.

### Schema Visualizer
Run command: `SymbioseDB: Visualize Schema`

### Performance Analysis
Run command: `SymbioseDB: Analyze Query Performance`

## Configuration

```json
{
  "symbiosedb.connectionString": "postgresql://...",
  "symbiosedb.enableLivePreview": true,
  "symbiosedb.enablePerformanceHints": true
}
```
