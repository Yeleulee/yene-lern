import { VideoSummary } from '../types';

// Use the provided API key
const API_KEY = "AIzaSyA7jQcLw_M0Dt6ZMQFf7VOsJsAPKo6h35Y";
// Debug logging (only showing first 4 and last 4 characters for security)
if (API_KEY) {
  const keyStart = API_KEY.substring(0, 4);
  const keyEnd = API_KEY.substring(API_KEY.length - 4);
  console.log(`Gemini API key found (${API_KEY.length} chars): ${keyStart}...${keyEnd}`);
} else {
  console.log('No Gemini API key found in environment variables');
}
console.log('Environment variables available:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

// Define potential API endpoints to try
const API_ENDPOINTS = {
  beta: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  v1: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent',
  v1beta15: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
};

// Start with beta endpoint - will be updated if compatibility check finds a better one
let API_URL = API_ENDPOINTS.beta;

// Add exponential backoff retry mechanism for API requests
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // If response is successful or not a server error (5xx), return it
      if (response.ok || response.status < 500) {
        return response;
      }
      
      // Otherwise, it's a server error (5xx), so we should retry
      retries++;
      const delay = Math.min(1000 * 2 ** retries, 10000); // Exponential backoff capped at 10 seconds
      
      console.warn(`Attempt ${retries}/${maxRetries} failed with status ${response.status}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      // Network errors also deserve a retry
      retries++;
      const delay = Math.min(1000 * 2 ** retries, 10000);
      console.warn(`Network error on attempt ${retries}/${maxRetries}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we've exhausted retries, throw an error
  throw new Error(`Failed after ${maxRetries} retries`);
}

export async function generateVideoSummary(
  title: string,
  description: string,
  userQuestion?: string
): Promise<VideoSummary> {
  try {
    let prompt = `
      You are an AI learning assistant. Based on the following YouTube video information, 
      please generate:
      1. A brief summary (2-3 sentences) of what the video is about
      2. Two related topics the user could learn next
      
      Video Title: ${title}
      Video Description: ${description}
    `;

    if (userQuestion) {
      prompt += `\nUser Question: ${userQuestion}\nPlease also provide a helpful response to this question.`;
    }

    const response = await fetchWithRetry(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for expected response format
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected response format from Gemini API:', data);
      throw new Error('Invalid response format from API');
    }
    
    const text = data.candidates[0].content.parts[0].text;

    // Parse the response to extract summary, next topics and response
    const summaryMatch = text.match(/Summary:(.*?)(?=Next Topics:|$)/s);
    const nextTopicsMatch = text.match(/Next Topics:(.*?)(?=Response:|$)/s);
    const responseMatch = text.match(/Response:(.*?)$/s);

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : 'Summary not available',
      nextTopics: nextTopicsMatch
        ? nextTopicsMatch[1]
            .trim()
            .split(/,|\n/)
            .filter(Boolean)
            .map((topic: string) => topic.trim().replace(/^\d+\.\s*/, ''))
            .slice(0, 2)
        : ['Related topic suggestion not available'],
      response: responseMatch ? responseMatch[1].trim() : undefined,
    };
  } catch (error) {
    console.error('Error generating video summary:', error);
    return {
      summary: 'Unable to generate summary at this time.',
      nextTopics: ['Topic 1', 'Topic 2'],
      response: userQuestion ? 'Unable to answer question at this time.' : undefined,
    };
  }
}

// Function to validate if the API key has the correct format
function isValidApiKey(key: string): boolean {
  // Gemini API keys usually start with "AIza" and are typically 39 characters long
  return key.trim().startsWith('AIza') && key.trim().length >= 30;
}

// Enhanced function to ask general questions to Gemini with education-specific context
export async function askGemini(question: string): Promise<string> {
  console.log("Received question for Gemini:", question);
  
  // Check for internet connectivity
  if (!navigator.onLine) {
    console.warn('No internet connection detected');
    throw new Error("You're currently offline. Please check your internet connection and try again.");
  }
  
  // Check if API key is missing
  if (!API_KEY) {
    console.error('No Gemini API key provided');
    throw new Error("The Gemini API key is missing. Please add your API key to the environment variables.");
  }
  
  // Validate API key format
  if (!isValidApiKey(API_KEY)) {
    console.error('Invalid API key format');
    throw new Error("The Gemini API key appears to be invalid. Make sure your API key starts with 'AIza' and is properly formatted.");
  }

  const systemPrompt = `You are an educational AI assistant for Yene Learn, an Ethiopian online learning platform that helps students understand video content.
  Your goal is to provide helpful, informative, and educational responses with these characteristics:
  - Focus on educational content and learning
  - Be concise but thorough
  - Provide examples when helpful
  - If the question is about programming, provide code snippets
  - If you don't know something, admit it rather than making up information
  - Format your response with markdown when appropriate
  
  User question: ${question}`;

  console.log('Sending request to Gemini API...');
  
  const response = await fetchWithRetry(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini API error:', errorData);
    
    if (response.status === 400) {
      throw new Error("Your request couldn't be processed. It may contain content that can't be addressed.");
    }
    
    if (response.status === 403 || response.status === 401) {
      throw new Error("API authentication error: The API key is invalid or has insufficient permissions.");
    }
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. The API is receiving too many requests. Please try again in a few moments.");
    }
    
    throw new Error(`API error (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('Received response from Gemini API');
  
  // Safety check for expected response format
  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    console.error('Unexpected response format from Gemini API:', data);
    
    // Check for specific error conditions
    if (data.error) {
      throw new Error(`API Error: ${data.error.message || 'Unknown error'}`);
    }
    
    throw new Error("Received a response with unexpected format from the API.");
  }
  
  return data.candidates[0].content.parts[0].text;
}

// Function to test the Gemini API connection
export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  console.log("Testing Gemini API connection with key:", API_KEY.substring(0, 4) + "..." + API_KEY.substring(API_KEY.length - 4));
  
  try {
    // First check if API key exists
    if (!API_KEY) {
      return {
        success: false,
        message: "No Gemini API key provided. Please add your API key in the environment variables."
      };
    }
    
    // Validate API key format
    if (!isValidApiKey(API_KEY)) {
      return {
        success: false,
        message: "The API key format appears to be invalid. Gemini API keys should start with 'AIza' and be at least 30 characters long."
      };
    }

    // Use a simple test request that should be fast and reliable
    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Test connection. Respond with 'OK'.",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        }),
        // Add a timeout to the request
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API connection test failed:', response.status, errorData);
        
        if (response.status === 403 || response.status === 401) {
          return {
            success: false,
            message: "API key is invalid or unauthorized. Please check your API key configuration."
          };
        }
        
        if (response.status === 429) {
          return {
            success: false,
            message: "Rate limit exceeded. The API has received too many requests. Please try again later."
          };
        }
        
        return {
          success: false,
          message: `API error (${response.status}): ${errorData.error?.message || response.statusText}`
        };
      }

      // Try to parse the response to verify it's valid
      const data = await response.json();
      if (!data.candidates || !data.candidates[0]?.content?.parts) {
        console.warn('Response format unexpected:', data);
        return {
          success: false,
          message: "Connected to API but received an unexpected response format."
        };
      }

      return {
        success: true,
        message: "Successfully connected to the Gemini API"
      };
    } catch (error) {
      // Handle AbortError specifically for timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: "Connection timed out. The API took too long to respond."
        };
      }
      
      console.error("Error in API request during connection test:", error);
      return {
        success: false,
        message: error instanceof Error 
          ? `API request error: ${error.message}` 
          : "Unknown error in API request"
      };
    }
  } catch (error) {
    console.error("Error testing Gemini connection:", error);
    return {
      success: false,
      message: error instanceof Error 
        ? `Connection error: ${error.message}` 
        : "Unknown error connecting to Gemini API"
    };
  }
}

// Function to test which Gemini API endpoint works best
export async function checkGeminiCompatibility(): Promise<{ 
  workingEndpoint: string | null; 
  error?: string;
  message: string;
}> {
  console.log("Running Gemini API compatibility check...");
  
  // If no API key, don't bother checking
  if (!API_KEY || !isValidApiKey(API_KEY)) {
    return {
      workingEndpoint: null,
      error: "Invalid or missing API key",
      message: "Cannot check compatibility without a valid API key."
    };
  }
  
  // Simple test prompt that any model should be able to answer
  const testPrompt = "What is 2+2? Respond only with the number.";
  
  // Check each endpoint
  const results = [];
  
  for (const [name, endpoint] of Object.entries(API_ENDPOINTS)) {
    try {
      console.log(`Testing endpoint: ${name}`);
      
      const response = await fetch(`${endpoint}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: testPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 5
          }
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout per endpoint
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts) {
          console.log(`Endpoint ${name} is working!`);
          
          // Update the global API_URL to use this working endpoint
          API_URL = endpoint;
          
          return {
            workingEndpoint: name,
            message: `Found working endpoint: ${name}`
          };
        } else {
          results.push({ name, status: 'invalid-response', code: response.status });
        }
      } else {
        results.push({ name, status: 'error', code: response.status });
      }
    } catch (error) {
      console.error(`Error with endpoint ${name}:`, error);
      results.push({ 
        name, 
        status: 'exception',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // If we get here, none of the endpoints worked
  console.error("No working endpoints found:", results);
  
  return {
    workingEndpoint: null,
    error: "No compatible endpoints found",
    message: "Could not find a working Gemini API endpoint. This may be due to API key restrictions, region limitations, or service availability."
  };
}