/**
 * Search API Route
 *
 * Semantic search across indexed documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { advancedRAG } from '@/lib/symbiosedb';
import { initializeData } from '@/lib/init-data';

export async function POST(request: NextRequest) {
  try {
    // Initialize data if needed
    await initializeData();

    const { query, topK = 5, useMultiQuery = true } = await request.json();

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query cannot be empty' },
        { status: 400 }
      );
    }

    // Use multi-query fusion for better results
    const result = useMultiQuery
      ? await advancedRAG.queryWithFusion({
          query,
          multiQueryCount: 3,
        })
      : await advancedRAG.cachedQuery({ query, topK });

    return NextResponse.json({
      query: result.query,
      results: result.results,
      latency: result.latency,
      cached: (result as any).cached ?? false,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
