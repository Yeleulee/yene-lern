
// Service to interact with DeepSeek via OpenRouter
import { VideoSummary } from '../types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface DeepSeekResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

export async function askDeepSeek(question: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        console.error("OpenRouter API Key is missing");
        throw new Error("OpenRouter API Key is missing. Please add VITE_OPENROUTER_API_KEY to your .env file.");
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin, // Required by OpenRouter for free tier
                'X-Title': 'Yene Learn', // Optional
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-r1:free',
                messages: [
                    {
                        role: 'system',
                        content: `You are an educational AI assistant for Yene Learn. 
            Provide helpful, concise, and accurate responses focused on learning.
            Use Markdown for formatting.`
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                temperature: 0.7,
                top_p: 0.9,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from OpenRouter");
        }

        const content = data.choices[0].message.content;
        // Remove <think> blocks if present (DeepSeek R1 feature)
        return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    } catch (error) {
        console.error("DeepSeek API Error:", error);
        throw error;
    }
}

export async function testDeepSeekConnection(): Promise<{ success: boolean; message: string }> {
    if (!OPENROUTER_API_KEY) {
        return { success: false, message: "No OpenRouter API key found. Check .env" };
    }
    try {
        // Test payload - using the most robust free model id
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Yene Learn',
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-r1:free',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });

        if (response.ok) return { success: true, message: "Connected to DeepSeek via OpenRouter" };
        const errData = await response.json().catch(() => ({}));
        return { success: false, message: errData.error?.message || `Failed to connect: ${response.status}` };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function generateVideoSummary(
    title: string,
    description: string,
    userQuestion?: string
): Promise<VideoSummary> {
    const prompt = `Analyze this video:
  Title: ${title}
  Description: ${description}
  
  Task:
  1. Summarize it in 2-3 sentences.
  2. Suggest 2 related topics.
  ${userQuestion ? `3. Answer this User Question: "${userQuestion}"` : ''}
  
  Output ONLY valid JSON with keys: "summary", "nextTopics" (array of strings)${userQuestion ? ', "response"' : ''}.
  Do not include markdown formatting (like \`\`\`json). Just the JSON object.`;

    try {
        const jsonString = await askDeepSeek(prompt);
        // clean up potential markdown code blocks
        const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);

        return {
            summary: data.summary || "Summary not available",
            nextTopics: data.nextTopics || ["Topic A", "Topic B"],
            response: data.response
        };
    } catch (e) {
        console.error("Error generating summary:", e);
        return {
            summary: "Could not generate summary.",
            nextTopics: ["Learning", "Education"],
            response: userQuestion ? "I couldn't answer that right now." : undefined
        };
    }
}
