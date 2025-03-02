export async function POST(req: Request) {
    try {
        // Extract filename from URL if provided
        const url = new URL(req.url);
        const requestedFilename = url.searchParams.get('filename');
        const isImagePack = requestedFilename?.endsWith('.zip');
        
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
            if (!response.ok) {
                throw new Error(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
            }
            blob = await response.blob();
            contentType = response.headers.get('content-type') || 'image/png';
        }
        
        // Determine filename and content type
        let filename;
        const headers = new Headers();
        
        if (isImagePack) {
            // This is an image pack ZIP file
            filename = requestedFilename || `image-pack-${Date.now()}.zip`;
            contentType = 'application/zip';
            headers.set('Content-Type', 'application/zip');
            headers.set('Content-Disposition', `attachment; filename=${filename}`);
        } else {
            // This is a regular image
            const isWebP = imageUrl.endsWith('webp') || contentType.includes('webp');
            const extension = isWebP ? 'webp' : (contentType.split('/')[1] || 'png');
            filename = requestedFilename || `generated-image-${Date.now()}.${extension}`;
            
            if (isWebP) {
                headers.set('Content-Type', 'application/octet-stream');
                headers.set('Content-Disposition', `attachment; filename=${filename}`);
                headers.set('X-Content-Type-Options', 'nosniff');
            } else {
                headers.set('Content-Type', contentType);
                headers.set('Content-Disposition', `attachment; filename=${filename}`);
            }
        }
        
        console.log(`Downloading as: ${filename}, Content-Type: ${contentType}`);
        return new Response(blob, { headers });
    } catch (error) {
        console.error('Download failed:', error);
        return new Response(JSON.stringify({ error: 'Failed to download image' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
