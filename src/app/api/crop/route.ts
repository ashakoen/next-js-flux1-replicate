import sharp from 'sharp';

export async function POST(req: Request) {
  try {
    const { imageUrl, cropData } = await req.json();

    // Fetch the original image from Replicate
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    const imageBuffer = await response.arrayBuffer();

    // Process the image using Sharp
    const image = sharp(Buffer.from(imageBuffer));

    // Get image metadata
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Failed to get image dimensions');
    }

    // Validate crop dimensions
    const cropX = Math.max(0, Math.min(Math.round(cropData.x), metadata.width - 1));
    const cropY = Math.max(0, Math.min(Math.round(cropData.y), metadata.height - 1));
    const cropWidth = Math.max(1, Math.min(Math.round(cropData.width), metadata.width - cropX));
    const cropHeight = Math.max(1, Math.min(Math.round(cropData.height), metadata.height - cropY));

    // Apply crop with validated dimensions
    const croppedImage = await image
      .extract({
        left: cropX,
        top: cropY,
        width: cropWidth,
        height: cropHeight
      })
      .toBuffer();

    // Return the cropped image
    return new Response(croppedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="cropped-image.png"'
      }
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(JSON.stringify({ error: 'Failed to process image' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
