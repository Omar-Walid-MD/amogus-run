import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(), // Add this plugin for polyfills like fs
  ],
  resolve: {
    alias: {
      path: 'path-browserify', // Alias path to the browser version
    },
  },
  define: {
    'process.env': {}, // Disable process.env to prevent issues
  },
  optimizeDeps: {
    include: ['path-browserify'], // Make sure path-browserify is optimized
  },
})
