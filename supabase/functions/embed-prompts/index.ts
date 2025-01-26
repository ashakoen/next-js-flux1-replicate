// @ts-ignore
/// <reference lib="deno.ns" />

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const embeddingsApiUrl = Deno.env.get('EMBEDDINGS_API_URL')!
const embeddingsApiModel = Deno.env.get('EMBEDDINGS_MODEL')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getEmbedding(prompt: string) {
    try {
        const response = await fetch(embeddingsApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: embeddingsApiModel,
                prompt: prompt
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.embedding;
    } catch (error) {
        console.error('Error getting embedding for prompt:', prompt, error);
        return null;
    }
}

serve(async (req) => {
    try {
        const payload = await req.json()
        
        // Extract the prompt from the webhook payload
        const prompt = payload.record.generation_parameters.prompt
        const telemetryId = payload.record.id

        // Skip if prompt is empty or null
        if (!prompt) {
            return new Response(JSON.stringify({ 
                message: 'No prompt found in payload' 
            }), { status: 200 })
        }

        // Check if embedding already exists
        const { data: existing } = await supabase
            .from('prompt_embeddings')
            .select('id')
            .eq('prompt', prompt)
            .maybeSingle()

        if (existing) {
            return new Response(JSON.stringify({ 
                message: 'Embedding already exists for this prompt' 
            }), { status: 200 })
        }

        // Generate embedding
        const embedding = await getEmbedding(prompt)
        
        if (!embedding) {
            throw new Error('Failed to generate embedding')
        }

        // Insert into prompt_embeddings
        const { error: insertError } = await supabase
            .from('prompt_embeddings')
            .insert({
                telemetry_id: telemetryId,
                prompt: prompt,
                embedding: embedding
            })

        if (insertError) {
            throw insertError
        }

        return new Response(JSON.stringify({ 
            message: 'Successfully processed prompt and stored embedding',
            prompt,
            telemetryId
        }), { status: 200 })

    } catch (error) {
        console.error('Error processing webhook:', error)
        return new Response(JSON.stringify({ 
            error: error.message 
        }), { status: 500 })
    }
})