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

// New function to ask general questions to Gemini
export async function askGemini(question: string): Promise<string> {
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
                text: question,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error asking Gemini:', error);
    return 'Sorry, I was unable to process your question at this time.';
  }
}