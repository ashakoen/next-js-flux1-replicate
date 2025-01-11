import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    console.log('Received telemetry data:', telemetryData);

    // Skip telemetry logging if API key is missing or invalid
    if (!telemetryData.user_hash || telemetryData.errors?.some((error: string) => 
      error.includes('API key') || error.includes('authentication')
    )) {
      console.log('Skipping telemetry due to API key issues');
      return NextResponse.json({ 
        message: 'Skipped telemetry for API key error',
        skipped: true 
      }, { status: 200 });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('telemetry')
      .insert([{
        user_hash: telemetryData.user_hash,
        request_id: telemetryData.requestId,
        request_start_time: telemetryData.requestStartTime,
        response_time: telemetryData.responseTime,
        total_duration: telemetryData.totalDuration,
        status_changes: telemetryData.statusChanges,
        polling_steps: telemetryData.pollingSteps,
        generation_parameters: telemetryData.generationParameters,
        output_image_sizes: telemetryData.outputImageSizes,
        client_info: telemetryData.clientInfo,
        time_of_day: telemetryData.timeOfDay,
        day_of_week: telemetryData.dayOfWeek,
        errors: telemetryData.errors,
        cancelled_by_user: telemetryData.cancelledByUser,
        replicate_id: telemetryData.replicateId,
        replicate_model: telemetryData.replicateModel,
        replicate_version: telemetryData.replicateVersion,
        replicate_created_at: telemetryData.replicateCreatedAt,
        replicate_started_at: telemetryData.replicateStartedAt,
        replicate_completed_at: telemetryData.replicateCompletedAt,
        replicate_predict_time: telemetryData.replicatePredictTime
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