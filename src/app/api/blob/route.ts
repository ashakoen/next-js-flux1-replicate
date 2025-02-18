import { put, list, del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createHash } from 'crypto';

// Helper function to hash API key
function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

// Store image pack
export async function POST(request: Request) {
  try {
    const headersList = headers();
    const apiKey = headersList.get('X-API-Key');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const userHash = hashApiKey(apiKey);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const timestamp = new Date().toISOString();
    const filename = `image-packs/${userHash}/${timestamp}.zip`;
    
    const blob = await put(filename, file, {
      contentType: 'application/zip',
      access: 'public',
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Error storing image pack:', error);
    return NextResponse.json(
      { error: 'Failed to store image pack' }, 
      { status: 500 }
    );
  }
}

// List user's image packs
export async function GET(request: Request) {
  try {
    const headersList = headers();
    const apiKey = headersList.get('X-API-Key');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const userHash = hashApiKey(apiKey);
    const { blobs } = await list({ prefix: `image-packs/${userHash}/` });
    
    // For each zip file, extract the image and config
    const packs = await Promise.all(
      blobs.map(async (blob) => {
        try {
          console.log('Processing blob:', blob.url);
          const response = await fetch(blob.url);
          const contentType = response.headers.get('content-type');
          console.log('Response type:', contentType);
          
          const arrayBuffer = await response.arrayBuffer();
          console.log('ArrayBuffer size:', arrayBuffer.byteLength);
          
          const JSZip = (await import('jszip')).default;
          const zip = await JSZip.loadAsync(arrayBuffer);
          
          // Log zip contents
          console.log('Zip contents:', Object.keys(zip.files));
          
          // Find the image file (not json)
          const imageFile = Object.values(zip.files).find(f => !f.name.endsWith('.json'));
          const configFile = Object.values(zip.files).find(f => f.name.endsWith('.json'));
          
          console.log('Found files:', {
            imageFile: imageFile?.name,
            configFile: configFile?.name
          });
          
          if (!imageFile || !configFile) {
            throw new Error('Invalid pack format');
          }
          
          // Get image as data URL using server-side Buffer
          const imageBuffer = await imageFile.async('arraybuffer');
          const base64 = Buffer.from(imageBuffer).toString('base64');
          const mimeType = imageFile.name.endsWith('.png') ? 'image/png' : 
                          imageFile.name.endsWith('.webp') ? 'image/webp' : 
                          'image/jpeg';
          const imageDataUrl = `data:${mimeType};base64,${base64}`;
          
          // Get config data
          const configText = await configFile.async('text');
          const config = JSON.parse(configText);
          
          return {
            url: blob.url,
            imageUrl: imageDataUrl,
            ...config
          };
        } catch (error) {
          console.error('Error processing pack:', error);
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              name: error.name,
              stack: error.stack
            });
          }
          return null;
        }
      })
    );
    
    // Filter out any failed packs
    const validPacks = packs.filter(pack => pack !== null);
    
    return NextResponse.json({ packs: validPacks });
  } catch (error) {
    console.error('Error listing image packs:', error);
    return NextResponse.json(
      { error: 'Failed to list image packs' }, 
      { status: 500 }
    );
  }
}

// Delete image pack (with user verification)
export async function DELETE(request: Request) {
  try {
    const headersList = headers();
    const apiKey = headersList.get('X-API-Key');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const userHash = hashApiKey(apiKey);
    const { url } = await request.json();
    
    // Verify the blob belongs to the user
    if (!url.includes(`image-packs/${userHash}/`)) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this image pack' }, 
        { status: 403 }
      );
    }

    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image pack:', error);
    return NextResponse.json(
      { error: 'Failed to delete image pack' }, 
      { status: 500 }
    );
  }
}
