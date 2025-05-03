# Yene Learn Platform

A comprehensive learning platform that helps users discover, organize, and learn from educational videos.

## Features

- Save educational videos to your learning list
- Track learning progress across different courses
- AI-powered learning assistant to help with your learning journey
- Segmented video learning with chapter-based navigation

## Setting Up the Gemini API

The AI chat functionality requires a Gemini API key to work properly. Follow these steps to set it up:

1. **Get a Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create or sign in to your Google account
   - Create a new API key

2. **Configure the API Key**:
   - Create a `.env` or `.env.local` file in the project root
   - Add the following line with your actual API key:
     ```
     VITE_GEMINI_API_KEY=your_gemini_api_key_here
     ```
   - Restart the development server if it's already running

3. **Verify the Connection**:
   - Open the application
   - Navigate to the Learning Chat section
   - Try sending a message to verify the connection

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Troubleshooting API Issues

If you experience issues with the AI chat:

1. Check that your API key is correctly set in the `.env` file
2. Ensure your API key has not expired or reached its quota limit
3. Verify your internet connection
4. Check the browser console for specific error messages

## License

MIT 