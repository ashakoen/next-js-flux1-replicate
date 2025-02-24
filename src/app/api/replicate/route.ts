export async function POST(req: Request): Promise<Response> {
	try {

        const apiKey = req.headers.get('X-API-Key');
        if (!apiKey) {
            console.error('Error: API key is missing');
            return new Response(JSON.stringify({ error: 'API key is required' }), { status: 400 });
        }

		const { body, getUrl, cancelUrl } = await req.json();

		const model = body?.model;

		if (body?.enhancePrompt) {
			if (!body.prompt) {
				return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
			}

			const prediction = await fetch("https://api.replicate.com/v1/models/meta/meta-llama-3.1-405b-instruct/predictions", {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					"Prefer": "wait"
				},
				body: JSON.stringify({
					input: {
						top_k: 50,
						top_p: 0.9,
						prompt: `[prompt]: ${body.prompt} [enhancement]: ${body.enhancement || 'none'}`,
						max_tokens: 4096,
						min_tokens: 0,
						temperature: 0.7,
						system_prompt: "You are a helpful assistant who knows how to properly write detailed image generation prompts for image diffusion models, using the following generic template as a guide:\n\n[Subject], [Environment], [Style], [Quality], [Additional Details]\n\nThe user will provide a sub-optimal image generation prompt indicated by [prompt] that they would like enhanced along with an enhancement word or phrase indicated by [enhancement], and you will use your knowledge of image generation systems to output a better, more verbose and more detailed version of the user-supplied prompt that aligns with the enhancement request provided by the user, taking into account both the original prompt and the user-supplied enhancement word or phrase, substituting elements of the prompt as deemed necessary. You will use your semantic knowledge to interpret the user's intention with regards to the original prompt, combining this with your interpretation of the user's intention with regard to the user-supplied enhancement word or phrase in order to generate a new and enhanced version of the original prompt.\n\nIf your semantic interpretation of the user-supplied prompt leads you to beleive the user is trying to generate an image of a person, you will include extra details in the prompt in order to properly render human anatomy.\n\nIf your sementic interpretation of the user-supplied prompt leads you to believe the user is trying to generate a certain image style, or photographic technique, you will include extra details in the prompt in order to properly render the image style or photographic technique.\n\nIf your sementic interpretation of the user-supplied prompt leads you to believe the user is trying to generate an image with a specific theme or emotion, you will include extra details in the prompt in order to properly render the image subject to express the theme or emotion.\n\nOnly output the updated prompt. No additional comments or commentary to the user.",
						presence_penalty: 0,
						frequency_penalty: 0
					}
				})
			});

			return new Response(JSON.stringify(await prediction.json()));
		} else if (body?.generateDescription) {
			const imageBase64 = body.image;

			if (!imageBase64) {
				return new Response(JSON.stringify({ error: 'Image data is required' }), { status: 400 });
			}

			if (!imageBase64.startsWith('data:')) {
				return new Response(JSON.stringify({ error: 'Invalid image format. Expected base64 data URL.' }), { status: 400 });
			}

			const prediction = await fetch("https://api.replicate.com/v1/predictions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Token ${apiKey}`,
				},
				body: JSON.stringify({
					version: "80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb",
					input: {
						image: imageBase64,
						prompt: "Describe this image in single-paragraph format, with as much creative and visual detail as possible, describing both the subject and the surroundings. Focus on the subject. Be descriptive and verbose using a minimum of 300 words when possible. If the subject is human, use extreme detail.",
						max_tokens: 2048,
						temperature: 0.7,
						top_p: 1
					}
				})
			});

			return new Response(JSON.stringify(await prediction.json()));
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
