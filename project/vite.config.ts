import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Fix for debug package ESM issues
      debug: path.resolve(__dirname, 'node_modules/debug/src/browser.js')
    }
  }
});