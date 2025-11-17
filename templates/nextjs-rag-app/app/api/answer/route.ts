/**
 * Answer API Route
 *
 * Q&A with source citations
 */

import { NextRequest, NextResponse } from 'next/server';
import { ragPipeline } from '@/lib/symbiosedb';
import { initializeData } from '@/lib/init-data';

export async function POST(request: NextRequest) {
  try {
    // Initialize data if needed
    await initializeData();

    const { question } = await request.json();

    if (!question || question.trim() === '') {
      return NextResponse.json(
        { error: 'Question cannot be empty' },
        { status: 400 }
      );
    }

    // Generate answer with sources
    const result = await ragPipeline.answer({
      question,
    });

    return NextResponse.json({
      question: result.question,
      answer: result.answer,
      confidence: result.confidence,
      sources: result.sources,
    });
  } catch (error: any) {
    console.error('Answer error:', error);
    return NextResponse.json(
      { error: error.message || 'Answer generation failed' },
      { status: 500 }
    );
  }
}
