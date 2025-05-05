import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory.
  // By default, Vite uses `.env` files, but we're adding explicit console logs for debugging
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log env loading
  console.log('Vite loading environment in mode:', mode);
  console.log('VITE_* environment variables detected:', 
    Object.keys(env).filter(key => key.startsWith('VITE_')).join(', '));
  
  if (env.VITE_GEMINI_API_KEY) {
    console.log('VITE_GEMINI_API_KEY is defined');
  } else {
    console.log('VITE_GEMINI_API_KEY is NOT defined');
  }
  
  return {
    plugins: [react()],
    define: {
      // Make all environment variables available in the app
      // This explicitly exposes them globally
      '__ENV__': env
    },
    resolve: {
      alias: {
        // Fix for debug package ESM issues
        debug: path.resolve(__dirname, 'node_modules/debug/src/browser.js')
      }
    }
  };
});