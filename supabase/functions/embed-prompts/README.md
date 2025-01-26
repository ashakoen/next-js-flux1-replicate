# Prompt Embedding Edge Function

This Edge Function automatically generates embeddings for prompts when new telemetry records are inserted. It listens for database changes via webhooks and processes new prompts using a local embedding model.

## Overview

The function:
1. Receives webhook notifications for new telemetry records
2. Extracts the prompt from the generation parameters
3. Generates an embedding using a local embedding model
4. Updates the telemetry record with the embedding

## Configuration

### Environment Variables
Required environment variables in Supabase dashboard:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

### Database Setup
The telemetry table needs a column for storing embeddings:
```sql
alter table telemetry 
add column prompt_embedding vector(768);
```

### Deployment
Deploy the function using Supabase CLI:
```bash
supabase functions deploy embed-prompts
```

### Database Webhook
Configure a database webhook in Supabase dashboard:
1. Go to Database → Webhooks
2. Create new webhook
3. Set trigger: INSERT on telemetry table
4. Target URL: your deployed function URL

## Testing

Test the function locally:
```bash
supabase functions serve embed-prompts --env-file .env.local
```

Send a test request:
```bash
curl -i --request POST 'http://localhost:54321/functions/v1/embed-prompts' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"type":"INSERT","table":"telemetry","record":{"id":1,"generation_parameters":{"prompt":"test prompt"}}}'
```

## Monitoring

Monitor function execution:
```bash
supabase functions logs embed-prompts --tail
```

## Error Handling

The function handles common errors:
- Missing environment variables
- Invalid webhook payload
- Empty/missing prompts
- Embedding generation failures
- Database update errors

All errors are logged and returned with appropriate HTTP status codes.