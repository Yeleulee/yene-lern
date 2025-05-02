import { VideoSummary } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyA7jQcLw_M0Dt6ZMQFf7VOsJsAPKo6h35Y';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
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
  try {
    // If no API key is available, return a mock response instead of failing
    if (!API_KEY || API_KEY === 'AIzaSyA7jQcLw_M0Dt6ZMQFf7VOsJsAPKo6h35Y') {
      console.log('Using mock response because no valid API key was provided');
      // Return a mock response based on the question
      return generateMockResponse(question);
    }

    const systemPrompt = `You are an educational AI assistant for Yene Learn, an online learning platform that helps students understand video content.
    Your goal is to provide helpful, informative, and educational responses with these characteristics:
    - Focus on educational content and learning
    - Be concise but thorough
    - Provide examples when helpful
    - If the question is about programming, provide code snippets
    - If you don't know something, admit it rather than making up information
    - Format your response with markdown when appropriate
    
    User question: ${question}`;

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
                text: systemPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      // If API fails, fall back to mock response
      return generateMockResponse(question);
    }

    const data = await response.json();
    
    // Safety check for expected response format
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected response format from Gemini API:', data);
      return generateMockResponse(question);
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error asking Gemini:', error);
    return generateMockResponse(question);
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