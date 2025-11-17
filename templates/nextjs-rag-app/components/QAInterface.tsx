'use client';

import { useState } from 'react';

interface Source {
  documentId: string;
  chunkId: string;
  score: number;
}

interface Answer {
  question: string;
  answer: string;
  confidence: number;
  sources: Source[];
}

export default function QAInterface() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      setAnswer(data);
    } catch (error) {
      console.error('Answer error:', error);
      alert('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleAsk} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question... (try: 'What is SymbioseDB?' or 'How does RAG work?')"
            className="w-full px-6 py-4 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </form>

      {answer && (
        <div className="space-y-6">
          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Answer
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence:
                </span>
                <span
                  className={`text-sm font-medium ${
                    answer.confidence > 0.7
                      ? 'text-green-600 dark:text-green-400'
                      : answer.confidence > 0.4
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {Math.round(answer.confidence * 100)}%
                </span>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {answer.answer}
            </p>
          </div>

          {answer.sources.length > 0 && (
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Sources ({answer.sources.length})
              </h4>
              <div className="space-y-2">
                {answer.sources.map((source, idx) => (
                  <div
                    key={source.chunkId}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                  >
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      [{idx + 1}]
                    </span>
                    <span className="truncate">{source.documentId}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {Math.round(source.score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!answer && !loading && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <p>Ask a question to get started!</p>
          <p className="text-sm mt-2">
            Example: "What is SymbioseDB?" or "How does RAG work?"
          </p>
        </div>
      )}
    </div>
  );
}
