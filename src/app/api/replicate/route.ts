export async function POST(req: Request): Promise<Response> {
	try {
		const { apiKey, body, getUrl, cancelUrl } = await req.json();

		const model = body?.model;

		if (!apiKey) {
			console.error('Error: API key is missing');
			return new Response(JSON.stringify({ error: 'API key is required' }), { status: 400 });
		}

        if (body?.fetchImageForBucket) {
            const imageUrl = body.imageUrl;
            
            if (!imageUrl) {
                return new Response(JSON.stringify({ error: 'Image URL is required' }), { status: 400 });
            }

            const response = await fetch(imageUrl, {
                headers: {
                    'Authorization': `Token ${apiKey}`,
                },
            });

            if (!response.ok) {
                return new Response(JSON.stringify({ error: 'Failed to fetch image' }), { status: response.status });
            }

            // Get image data as blob and convert to base64
            const imageBlob = await response.blob();
            const base64String = await imageBlob.arrayBuffer();
            
            return new Response(JSON.stringify({ 
                imageData: Buffer.from(base64String).toString('base64'),
                contentType: response.headers.get('content-type')
            }), { status: 200 });
        }

		// Add near the top with other conditions
		if (body?.validateLora) {
			console.log('Validating LoRA model:', body.modelPath);

			if (!body.modelPath || !body.version) {
				console.error('Missing required LoRA validation parameters');
				return new Response(
					JSON.stringify({ error: 'Missing modelPath or version' }), 
					{ status: 400 }
				);
			}

			try {
				const urlToFetch = `https://api.replicate.com/v1/models/${body.modelPath}/versions`;
				
				const response = await fetch(urlToFetch, {
					method: 'GET',
					headers: {
						'Authorization': `Token ${apiKey}`,
						'Content-Type': 'application/json',
					}
				});
		
				const data = await response.json();
				console.log('LoRA Validation Response:', response.status, data);
		
				if (!response.ok) {
					console.error('Error validating LoRA:', data);
					return new Response(JSON.stringify(data), { status: response.status });
				}
		
				return new Response(JSON.stringify(data), { status: 200 });
		
			} catch (error) {
				console.error('Error during LoRA validation:', error);
				return new Response(
					JSON.stringify({ error: 'Failed to validate LoRA model' }), 
					{ status: 500 }
				);
			}
		}

		let urlToFetch = 'https://api.replicate.com/v1/predictions';
		let method = 'POST';
		let fetchBody = JSON.stringify(body);

		if (getUrl) {
			urlToFetch = getUrl;
			method = 'GET';
			fetchBody = '';
		} else if (cancelUrl) {
			console.debug('Cancel URL provided:', cancelUrl); // Debug log for cancel URL
			urlToFetch = cancelUrl;
			method = 'POST';
			fetchBody = '';
		} else if (!body.version) {
			// No Private LoRA provided
			console.log('Processing model selection:', model);
			// Inside the else if (!body.version) block, before the switch statement
			console.log('Processing request with image/mask:', {
				hasImage: !!body.input?.image,
				hasMask: !!body.input?.mask
			});
			switch (model) {
				case 'schnell':
					urlToFetch = 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions';
					break;
				case 'pro':
					urlToFetch = 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions';
					break;
				case 'pro-ultra':
					urlToFetch = 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro-ultra/predictions';
					break;
				case 'recraftv3':
					// Check output format to determine which Recraft endpoint to use
					urlToFetch = body.input?.output_format === 'svg'
						? 'https://api.replicate.com/v1/models/recraft-ai/recraft-v3-svg/predictions'
						: 'https://api.replicate.com/v1/models/recraft-ai/recraft-v3/predictions';
					break;
				case 'ideogram':
					urlToFetch = 'https://api.replicate.com/v1/models/ideogram-ai/ideogram-v2/predictions';
					break;
				case 'luma':
						urlToFetch = 'https://api.replicate.com/v1/models/luma/photon/predictions';
						break;
				default: // 'dev'
					urlToFetch = 'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions';
			}

			// Parse fetchBody to an object, remove the model property, and stringify it back
			let fetchBodyObj = JSON.parse(fetchBody);
			delete fetchBodyObj.model;

			if (model === 'recraftv3') {
				const { prompt, width, height, style, output_format } = fetchBodyObj.input;
				fetchBodyObj.input = {
					prompt,
					size: `${width}x${height}`,
					style: style || 'any'
				};
			}

			if (model === 'luma') {
				const { 
					prompt, 
					aspect_ratio,
					image_reference_url,
					style_reference_url,
					character_reference_url,
					image_reference_weight,
					style_reference_weight,
					seed
				} = fetchBodyObj.input;
			
				fetchBodyObj.input = {
					prompt,
					aspect_ratio,
					seed: seed || Math.floor(Math.random() * 1000000)
				};
			
				// Add reference images and weights only if they exist
				if (image_reference_url) {
					fetchBodyObj.input.image_reference_url = image_reference_url;
					fetchBodyObj.input.image_reference_weight = image_reference_weight;
				}
			
				if (style_reference_url) {
					fetchBodyObj.input.style_reference_url = style_reference_url;
					fetchBodyObj.input.style_reference_weight = style_reference_weight;
				}
			
				if (character_reference_url) {
					fetchBodyObj.input.character_reference_url = character_reference_url;
				}
			}

			fetchBody = JSON.stringify(fetchBodyObj);

		}

		console.log(`Fetching URL: ${urlToFetch} with method: ${method}`);
		console.log('Request body:', fetchBody);

		const response = await fetch(urlToFetch, {
			method,
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: method === 'GET' ? undefined : fetchBody,
		});

		const data = await response.json();
		console.log('Response Status:', response.status);
		console.log('Response Data:', data);

		if (!response.ok) {
			console.error('Error from Replicate API:', data);
		}

		// Extract seed if this is a GET request and status is succeeded
		if (method === 'GET' && data.status === 'succeeded' && data.logs) {
			const seedMatch = data.logs.match(/Using seed: (\d+)/);
			if (seedMatch) {
				const extractedSeed = parseInt(seedMatch[1], 10);
				return new Response(JSON.stringify({ ...data, extractedSeed }), { status: response.status });
			}
		}

		return new Response(JSON.stringify(data), { status: response.status });

	} catch (error) {
		console.error('Server Error:', error);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
	}
}