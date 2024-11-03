export async function POST(req: Request): Promise<Response> {
	try {
	  const { apiKey, body, getUrl, cancelUrl, model } = await req.json();
  
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
		if (model === 'schnell') {
		  urlToFetch = 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions';
		} else {
		  urlToFetch = 'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions';
		}
  
		// Parse fetchBody to an object, remove the model property, and stringify it back
		let fetchBodyObj = JSON.parse(fetchBody);
		delete fetchBodyObj.model;
		fetchBody = JSON.stringify(fetchBodyObj);
  
	  }
  
	  console.log(`Fetching URL: ${urlToFetch} with method: ${method}`);
  
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