# Yene Learn Platform

A comprehensive learning platform that helps users discover, organize, and learn from educational videos.

## Features

- Save educational videos to your learning list
- Track learning progress across different courses
- AI-powered learning assistant to help with your learning journey
- Segmented video learning with chapter-based navigation

## Required API Keys

This application requires several API keys to function properly. **IMPORTANT: Never commit API keys to version control.**

### Setting Up API Keys

1. Create a `.env` or `.env.local` file in the project root
2. Add the following lines with your actual API keys:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Restart the development server if it's already running

### Where to Get API Keys:

1. **Firebase API Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create or select your project
   - Navigate to Project Settings to find your API key

2. **YouTube API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project and enable the YouTube Data API v3
   - Create credentials to get your API key

3. **Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create or sign in to your Google account
   - Create a new API key

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

If you experience issues with API connections:

1. Check that your API keys are correctly set in the `.env` file
2. Ensure your API keys have not expired or reached their quota limits
3. Verify your internet connection
4. Check the browser console for specific error messages

## License

MIT 