# SymbioseDB RAG App

AI-powered search and Q&A application built with SymbioseDB and Next.js 14.

## Features

- 🔍 **Semantic Search** - Find relevant documents using natural language
- 💬 **Q&A System** - Ask questions and get source-backed answers
- ⚡️ **Auto-Embedding** - Documents automatically vectorized
- 🎯 **Multi-Query Fusion** - Better results through query variations
- ✅ **Citation Verification** - Prevents hallucination with source tracking
- ⚡ **Fast** - Sub-millisecond cache lookups, <10ms queries
- 🎨 **Beautiful UI** - Clean, responsive interface

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Open Browser

Navigate to [http://localhost:3000](http://localhost:3000)

That's it! The sample documents are automatically indexed on first run.

## How It Works

### Document Processing

Documents in `data/sample-docs.ts` are automatically:
1. Chunked into semantic segments
2. Converted to embeddings (vectors)
3. Indexed for semantic search

### Search

The search interface uses **Reciprocal Rank Fusion (RRF)**:
- Generates 3 query variations
- Searches each variation
- Combines results for better recall

### Q&A

The Q&A interface:
- Finds relevant context for the question
- Generates answer from retrieved documents
- Provides confidence score and sources

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── search/route.ts    # Semantic search API
│   │   └── answer/route.ts    # Q&A API
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── components/
│   ├── SearchInterface.tsx    # Search UI
│   └── QAInterface.tsx        # Q&A UI
├── data/
│   └── sample-docs.ts         # Sample documents
├── lib/
│   ├── symbiosedb.ts          # SymbioseDB client
│   └── init-data.ts           # Data initialization
└── package.json
```

## Customization

### Add Your Own Documents

Edit `data/sample-docs.ts`:

```typescript
export const sampleDocuments = [
  {
    id: 'my-doc-1',
    content: 'Your document content here...',
    metadata: {
      category: 'custom',
      title: 'My Document',
      tags: ['tag1', 'tag2'],
    },
  },
  // Add more documents...
];
```

### Adjust RAG Settings

Edit `lib/symbiosedb.ts`:

```typescript
const ragPipeline = new RAGPipeline({
  documentProcessor,
  embeddingManager,
  topK: 5,              // Number of results
  minSimilarity: 0.3,   // Similarity threshold
});

const advancedRAG = new AdvancedRAG({
  pipeline: ragPipeline,
  enableQueryRewriting: true,
  enableMultiQuery: true,
  multiQueryCount: 3,   // Query variations
  cacheEnabled: true,
  cacheTTL: 300000,     // 5 minutes
});
```

## API Endpoints

### POST /api/search

Semantic search across documents.

**Request:**
```json
{
  "query": "What is RAG?",
  "topK": 5,
  "useMultiQuery": true
}
```

**Response:**
```json
{
  "query": "What is RAG?",
  "results": [
    {
      "id": "rag-features",
      "score": 0.89,
      "text": "RAG (Retrieval-Augmented Generation) Features...",
      "metadata": { "title": "RAG Features", "category": "features" }
    }
  ],
  "latency": 12,
  "cached": false
}
```

### POST /api/answer

Q&A with source citations.

**Request:**
```json
{
  "question": "What is SymbioseDB?"
}
```

**Response:**
```json
{
  "question": "What is SymbioseDB?",
  "answer": "Based on the available information: SymbioseDB is a unified database platform...",
  "confidence": 0.87,
  "sources": [
    { "documentId": "getting-started", "chunkId": "chunk-abc", "score": 0.89 }
  ]
}
```

## Performance

- **Sub-millisecond** cache lookups
- **<10ms** average query time
- **75%+** cache hit rate
- **Automatic** query optimization

## Learn More

- [SymbioseDB Documentation](https://github.com/symbiosedb/symbiosedb)
- [Next.js Documentation](https://nextjs.org/docs)
- [RAG Concepts](https://en.wikipedia.org/wiki/Retrieval-augmented_generation)

## License

MIT
