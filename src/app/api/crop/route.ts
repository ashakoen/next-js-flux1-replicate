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

    // Apply crop
    const croppedImage = await image
      .extract({
        left: Math.round(cropData.x),
        top: Math.round(cropData.y),
        width: Math.round(cropData.width),
        height: Math.round(cropData.height)
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
