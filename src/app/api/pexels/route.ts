import { NextResponse } from 'next/server';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20`,
        {
            headers: {
                Authorization: PEXELS_API_KEY!,
            },
        }
    );

    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch images' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data.photos);
}