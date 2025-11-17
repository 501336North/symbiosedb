/**
 * Initialize Sample Data
 *
 * Index sample documents into SymbioseDB RAG system
 */

import { ragPipeline } from './symbiosedb';
import { sampleDocuments } from '../data/sample-docs';

let initialized = false;

export async function initializeData() {
  if (initialized) {
    console.log('✓ Data already initialized');
    return;
  }

  console.log('📚 Indexing sample documents...');

  try {
    const results = await ragPipeline.indexDocuments(sampleDocuments);

    const successCount = results.filter((r) => r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + r.chunksIndexed, 0);

    console.log(`✓ Indexed ${successCount}/${results.length} documents`);
    console.log(`✓ Created ${totalChunks} searchable chunks`);

    initialized = true;
  } catch (error) {
    console.error('Error initializing data:', error);
    throw error;
  }
}
