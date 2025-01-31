import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('umap_coordinates')
      .select(`
        id,
        x, y, z,
        prompt_embedding:prompt_embeddings (
          id,
          prompt,
          telemetry:telemetry_id (
            generation_parameters
          )
        )
      `)
      .limit(1000)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching points:', error)
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 })
  }
}