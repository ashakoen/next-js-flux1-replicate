// Test script for blob storage API
async function testBlobStorage() {
  const API_KEY = process.env.REPLICATE_API_KEY;
  
  if (!API_KEY) {
    console.error('API key not found in environment');
    return;
  }

  // Test data
  const testPack = {
    prompt: "Test prompt",
    seed: 12345,
    timestamp: new Date().toISOString(),
    model: "test-model"
  };

  try {
    // 1. Test POST - Create a new pack
    console.log('Testing POST...');
    const createResponse = await fetch('/api/blob', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(testPack)
    });
    
    if (!createResponse.ok) {
      throw new Error(`POST failed: ${createResponse.statusText}`);
    }
    
    const { url } = await createResponse.json();
    console.log('Pack created successfully:', url);

    // 2. Test GET - List packs
    console.log('\nTesting GET...');
    const listResponse = await fetch('/api/blob', {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!listResponse.ok) {
      throw new Error(`GET failed: ${listResponse.statusText}`);
    }
    
    const { packs } = await listResponse.json();
    console.log('Packs retrieved:', packs);

    // 3. Test DELETE - Remove the pack
    console.log('\nTesting DELETE...');
    const deleteResponse = await fetch('/api/blob', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({ url })
    });
    
    if (!deleteResponse.ok) {
      throw new Error(`DELETE failed: ${deleteResponse.statusText}`);
    }
    
    console.log('Pack deleted successfully');

    // 4. Verify deletion
    console.log('\nVerifying deletion...');
    const verifyResponse = await fetch('/api/blob', {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`Verification GET failed: ${verifyResponse.statusText}`);
    }
    
    const { packs: remainingPacks } = await verifyResponse.json();
    console.log('Remaining packs:', remainingPacks);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testBlobStorage();
