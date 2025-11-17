'use client';

import { useState } from 'react';

interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata?: {
    title?: string;
    category?: string;
    tags?: string[];
  };
}

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, useMultiQuery: true }),
      });

      const data = await response.json();
      setResults(data.results || []);
      setLatency(data.latency);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation... (try: 'What is RAG?' or 'SymbioseDB features')"
            className="w-full px-6 py-4 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {latency !== null && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Found {results.length} results in {latency}ms
        </div>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.id}
            className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {result.metadata?.title || 'Document'}
              </h3>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {Math.round(result.score * 100)}% match
              </span>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {result.text}
            </p>

            {result.metadata?.tags && (
              <div className="flex flex-wrap gap-2">
                {result.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <p>No results yet. Try searching for something!</p>
          <p className="text-sm mt-2">Example: "What is RAG?" or "SymbioseDB features"</p>
        </div>
      )}
    </div>
  );
}
