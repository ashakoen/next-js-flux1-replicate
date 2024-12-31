export async function POST(req: Request): Promise<Response> {
	try {
		const { apiKey, body, getUrl, cancelUrl } = await req.json();

		const model = body?.model;

		console.log('Received model:', model);
		console.log('Received body:', body);

		if (!apiKey) {
			console.error('Error: API key is missing');
			return new Response(JSON.stringify({ error: 'API key is required' }), { status: 400 });
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