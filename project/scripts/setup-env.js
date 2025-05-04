/**
 * This script creates a clean .env file with required environment variables
 * Run with: node scripts/setup-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_TEMPLATE = `# API Keys - Replace with your own keys (REQUIRED)
VITE_FIREBASE_API_KEY=
VITE_YOUTUBE_API_KEY=
VITE_GEMINI_API_KEY=

# Firebase Configuration (optional - these are usually public)
VITE_FIREBASE_AUTH_DOMAIN=yene-learn.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yene-learn
VITE_FIREBASE_STORAGE_BUCKET=yene-learn.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
`;

const ENV_FILE_PATH = path.join(__dirname, '..', '.env');

// Check if .env file already exists
if (fs.existsSync(ENV_FILE_PATH)) {
  console.log('⚠️  .env file already exists. Rename or delete it first to create a new one.');
  console.log('To overwrite, run: node scripts/setup-env.js --force');
  
  if (process.argv.includes('--force')) {
    console.log('Force flag detected. Overwriting existing .env file...');
  } else {
    process.exit(1);
  }
}

// Create .env file with template
try {
  fs.writeFileSync(ENV_FILE_PATH, ENV_TEMPLATE);
  console.log('✅ Created .env file successfully!');
  console.log('Please edit the file and add your own API keys.');
  console.log('\nIMPORTANT: Never commit your API keys to version control!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
} 