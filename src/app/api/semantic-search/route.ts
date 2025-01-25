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

    // Log embedding request
    console.log('Requesting embedding');
    const embeddingResponse = await fetch(process.env.EMBEDDINGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.EMBEDDINGS_MODEL,
        prompt: searchTerm
      }),
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!embeddingResponse.ok) {
      console.error('Embedding request failed:', await embeddingResponse.text());
      throw new Error('Failed to generate embedding');
    }

    const { embedding } = await embeddingResponse.json();
    
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Invalid embedding response');
    }

    console.log('Received embedding of length:', embedding.length);

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