export async function POST(req: Request) {
    try {
        const { imageUrl } = await req.json();
        
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Determine content type and extension
        const contentType = response.headers.get('content-type') || 'image/png';
        const isWebP = imageUrl.endsWith('webp') || contentType.includes('webp');
        const extension = isWebP ? 'webp' : contentType.split('/')[1];
        
        // Create clean filename
        const filename = `generated-image-${Date.now()}.${extension}`;
        
        // Set headers differently for webp vs other formats
        const headers = new Headers();
        
        if (isWebP) {
            headers.set('Content-Type', 'application/octet-stream');
            headers.set('Content-Disposition', `attachment; filename=${filename}`);  // Removed quotes
            headers.set('X-Content-Type-Options', 'nosniff');
        } else {
            headers.set('Content-Type', contentType);
            headers.set('Content-Disposition', `attachment; filename=${filename}`);
        }
        
        return new Response(blob, { headers });
    } catch (error) {
        console.error('Download failed:', error);
        return new Response(JSON.stringify({ error: 'Failed to download image' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}