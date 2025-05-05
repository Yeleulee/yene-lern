// Simple diagnostic script to test Gemini API connectivity
import 'dotenv/config';

// Get the API key from environment variables
const API_KEY = process.env.VITE_GEMINI_API_KEY;

console.log(`API Key found: ${API_KEY ? 'Yes (starting with ' + API_KEY.substring(0, 4) + '...)' : 'No'}`);

// Test endpoint
const TEST_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent';

async function testConnection() {
  if (!API_KEY) {
    console.error('No API key found in environment variables!');
    console.log('Please add your Gemini API key to the .env file:');
    console.log('VITE_GEMINI_API_KEY=your_api_key_here');
    return;
  }

  console.log('Testing connection to Gemini API...');
  try {
    const response = await fetch(`${TEST_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: 'Hello, are you working? Reply with yes if you are.' }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100
        }
      })
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
    if (response.ok) {
      console.log('✅ Connection successful!');
    } else {
      console.log('❌ Connection failed!');
      console.log('Error:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testConnection(); 