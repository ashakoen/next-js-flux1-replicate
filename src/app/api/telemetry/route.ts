import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const telemetryData = await request.json()

    // Log the telemetry data to the server console
    console.log('Received telemetry data:', JSON.stringify(telemetryData, null, 2))

    // You can add additional processing or storage logic here in the future

    return NextResponse.json({ message: 'Telemetry data received successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error processing telemetry data:', error)
    return NextResponse.json({ message: 'Error processing telemetry data' }, { status: 500 })
  }
}