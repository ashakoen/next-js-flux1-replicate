export async function POST(req: Request) {
    try {
        const { imageUrl } = await req.json();
        
        let blob;
        let contentType;
        
        if (imageUrl.startsWith('data:')) {
            // Handle base64 data
            const [header, base64Data] = imageUrl.split(',');
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            contentType = header.split(';')[0].split(':')[1];
            blob = new Blob([bytes], { type: contentType });
        } else {
            // Handle URL
            const response = await fetch(imageUrl);
            blob = await response.blob();
            contentType = response.headers.get('content-type') || 'image/png';
        }
        
        // Determine extension
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
