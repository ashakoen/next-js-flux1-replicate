import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { searchTerm, apiKey } = await request.json();

    // Validate required environment variables
    if (!process.env.EMBEDDINGS_API_URL || !process.env.EMBEDDINGS_MODEL || !process.env.TELEMETRY_SALT) {
      console.error('Required environment variables missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Input validation
    if (!apiKey) {
      console.log('No API key provided');
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    if (!searchTerm?.trim()) {
      console.log('Empty search term');
      return NextResponse.json({ prompts: [] });
    }

    if (searchTerm.length > 1000) {
      return NextResponse.json({ error: 'Search term too long' }, { status: 400 });
    }

    const userHash = createHash('sha256')
      .update(apiKey + (process.env.TELEMETRY_SALT))
      .digest('hex');

    // Create cache key from search term
    const searchTermHash = createHash('md5')
      .update(searchTerm.trim().toLowerCase())
      .digest('hex');
    
    // Check cache in database
    const { data: cachedEmbedding, error: cacheError } = await supabase
      .from('search_embedding_cache')
      .select('embedding')
      .eq('search_term_hash', searchTermHash)
      .eq('model', process.env.EMBEDDINGS_MODEL)
      .single();

    let embedding: number[];
    
    if (cachedEmbedding) {
      console.log('Using cached embedding for search term');
      embedding = cachedEmbedding.embedding;
      await supabase
        .from('search_embedding_cache')
        .update({ last_accessed: new Date().toISOString() })
        .eq('search_term_hash', searchTermHash);
    } else {
      console.log('Requesting new embedding');
      const embeddingResponse = await fetch(process.env.EMBEDDINGS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.EMBEDDINGS_MODEL,
          prompt: searchTerm
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!embeddingResponse.ok) {
        console.error('Embedding request failed:', await embeddingResponse.text());
        throw new Error('Failed to generate embedding');
      }

      const { embedding: newEmbedding } = await embeddingResponse.json();
      
      if (!Array.isArray(newEmbedding) || newEmbedding.length === 0) {
        throw new Error('Invalid embedding response');
      }

      // Store in cache
      const { error: insertError } = await supabase
        .from('search_embedding_cache')
        .insert({
          search_term_hash: searchTermHash,
          search_term: searchTerm.trim().toLowerCase(),
          embedding: newEmbedding,
          model: process.env.EMBEDDINGS_MODEL
        });

      if (insertError) {
        console.error('Failed to cache embedding:', insertError);
      }
      
      embedding = newEmbedding;
      console.log('Cached new embedding');
    }

    console.log('Querying similar prompts');
    const { data: similarPrompts, error } = await supabase.rpc('match_user_prompts', {
      query_embedding: embedding,
      user_hash_param: userHash,
      match_threshold: 0.7,
      match_count: 10
    });

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return NextResponse.json({ prompts: similarPrompts });

  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' }, 
      { status: 500 }
    );
  }
}