import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type TelemetryResponse = {
  id: number;
  [key: string]: any;
}

export async function POST(request: Request) {
  try {
    const telemetryData = await request.json();
    //console.log('Received telemetry data:', telemetryData);

    const userHash = createHash('sha256')
      .update(telemetryData.apiKey + (process.env.TELEMETRY_SALT || 'default-salt'))
      .digest('hex');

    const { apiKey, ...safeData } = telemetryData;
    const telemetryWithHash = {
      ...safeData,
      user_hash: userHash
    };

    // Skip telemetry logging if API key is missing or invalid
    if (!telemetryWithHash.user_hash || telemetryWithHash.errors?.some((error: string) => 
      error.includes('API key') || error.includes('authentication')
    )) {
      console.log('Skipping telemetry due to API key issues');
      return NextResponse.json({ 
        message: 'Skipped telemetry for API key error',
        skipped: true 
      }, { status: 200 });
    }

    const currentTimestamp = new Date().toISOString();

    // Insert into Supabase
    const { data, error } = await supabase
      .from('telemetry')
      .insert([{
        user_hash: userHash,
        request_id: telemetryWithHash.requestId,
        request_start_time: telemetryWithHash.requestStartTime,
        response_time: telemetryWithHash.responseTime,
        total_duration: telemetryWithHash.totalDuration,
        status_changes: telemetryWithHash.statusChanges,
        polling_steps: telemetryWithHash.pollingSteps,
        generation_parameters: telemetryWithHash.generationParameters,
        output_image_sizes: telemetryWithHash.outputImageSizes,
        client_info: telemetryWithHash.clientInfo,
        time_of_day: telemetryWithHash.timeOfDay,
        day_of_week: telemetryWithHash.dayOfWeek,
        errors: telemetryWithHash.errors,
        cancelled_by_user: telemetryWithHash.cancelledByUser,
        replicate_id: telemetryWithHash.replicateId || `failed_${Date.now()}`,
        replicate_model: telemetryWithHash.replicateModel || 'unknown',
        replicate_version: telemetryWithHash.replicateVersion || 'unknown',
        // Use current timestamp for missing values
        replicate_created_at: telemetryWithHash.replicateCreatedAt || currentTimestamp,
        replicate_started_at: telemetryWithHash.replicateStartedAt || currentTimestamp,
        replicate_completed_at: telemetryWithHash.replicateCompletedAt || currentTimestamp,
        replicate_predict_time: telemetryWithHash.replicatePredictTime || 0
      }]) as { data: TelemetryResponse[] | null, error: any };

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Insert successful:', data);

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Telemetry data stored successfully',
      id: data?.[0]?.id 
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing telemetry data:', error);
    return NextResponse.json({ 
      message: 'Error processing telemetry data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}