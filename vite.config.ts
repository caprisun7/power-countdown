import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // CRITICAL: Setting base to './' ensures assets are loaded correctly 
    // when hosted in a subdirectory (like GitHub Pages)
    base: './',
    define: {
      // Prevent crash if env.API_KEY is undefined by defaulting to empty string
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Polyfill process.env for libraries that might expect it
      'process.env': {}
    }
  };
});