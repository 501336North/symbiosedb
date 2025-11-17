'use client';

import { useState } from 'react';
import SearchInterface from '@/components/SearchInterface';
import QAInterface from '@/components/QAInterface';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'search' | 'qa'>('search');

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SymbioseDB RAG Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            AI-powered search and Q&A built in 5 minutes
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Powered by SymbioseDB • Automatic embeddings • Multi-query fusion • Citation verification
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-800 p-1 bg-white dark:bg-gray-900">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              🔍 Semantic Search
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'qa'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              💬 Q&A
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mb-12">
          {activeTab === 'search' ? <SearchInterface /> : <QAInterface />}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-8">
          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
            <div className="text-2xl mb-3">⚡️</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Auto-Embedding
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Documents are automatically vectorized and indexed. No manual embedding required.
            </p>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Multi-Query Fusion
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Searches multiple query variations and fuses results using RRF algorithm.
            </p>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
            <div className="text-2xl mb-3">✅</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Citation Verification
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Answers are verified against sources to prevent hallucination.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-500 pb-8">
          <p>
            Built with{' '}
            <a
              href="https://github.com/symbiosedb/symbiosedb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              SymbioseDB
            </a>{' '}
            • The AI Stack in a Box
          </p>
        </div>
      </div>
    </main>
  );
}
