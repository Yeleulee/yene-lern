import { VideoSummary } from '../types';

// Replace the default key with a real Gemini API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyA7jQcLw_M0Dt6ZMQFf7VOsJsAPKo6h35Y';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
            .map((topic) => topic.trim().replace(/^\d+\.\s*/, ''))
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

// Enhanced function to ask general questions to Gemini with education-specific context
export async function askGemini(question: string): Promise<string> {
  // Check for internet connectivity
  if (!navigator.onLine) {
    console.warn('No internet connection detected');
    return "It appears you're offline. Please check your internet connection and try again.";
  }
  
  try {
    // Check if API key is the default one (always use the real API if available)
    const isUsingDefaultKey = API_KEY === 'AIzaSyA7jQcLw_M0Dt6ZMQFf7VOsJsAPKo6h35Y';
    
    if (isUsingDefaultKey) {
      console.warn('Using default API key - consider setting your own VITE_GEMINI_API_KEY in environment variables');
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
        return "I'm sorry, but your request couldn't be processed. It may contain content that can't be addressed.";
      }
      
      if (response.status === 403 || response.status === 401) {
        return "API key error: Please check that the Gemini API key is valid and has sufficient permissions.";
      }
      
      return "I encountered an error connecting to my knowledge base. Please try again later.";
    }

    const data = await response.json();
    console.log('Received response from Gemini API');
    
    // Safety check for expected response format
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected response format from Gemini API:', data);
      return "I received a response I couldn't understand. Please try asking in a different way.";
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error asking Gemini:', error);
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('retries')) {
        return "Network error: I'm having trouble connecting to my knowledge database. This could be due to internet connectivity issues or the API service being temporarily unavailable. Please try again in a moment.";
      }
      return `Error: ${error.message}`;
    }
    return "Something went wrong with my AI brain. Please try again later.";
  }
}

// Function to test the Gemini API connection
export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const testResponse = await askGemini("Hello, this is a test message. Please respond with 'Connection successful'.");
    return {
      success: true,
      message: "Successfully connected to the Gemini API"
    };
  } catch (error) {
    console.error("Error testing Gemini connection:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error connecting to Gemini API"
    };
  }
}

// Function to generate mock responses when the API is unavailable
function generateMockResponse(question: string): string {
  const questionLower = question.toLowerCase();
  
  // Check if the question is about a course
  if (questionLower.includes('course') || questionLower.includes('explain')) {
    return "This course covers fundamental concepts in web development, including HTML, CSS, and JavaScript. It's structured to help beginners understand the building blocks of modern websites and applications.";
  }
  
  // Check if asking for a summary
  if (questionLower.includes('summary') || questionLower.includes('summarize')) {
    return "This video provides an overview of key programming concepts, with practical examples and code demonstrations. The main topics covered include variables, functions, loops, and basic data structures.";
  }
  
  // Check if asking about how to apply knowledge
  if (questionLower.includes('apply') || questionLower.includes('practice')) {
    return "You can apply these concepts by working on small projects like a personal website or a simple web application. Try implementing what you've learned in a real-world context, which will help reinforce your understanding.";
  }
  
  // Default response for other types of questions
  return "I'm your Yene Learn AI assistant. While I'd normally connect to the Gemini API to answer your question, I'm currently using locally generated responses. I can help with course information, summaries, and practical advice about the learning materials.";
}