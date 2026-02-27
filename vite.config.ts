import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Protocol V15.0: Asset Compression (Brotli)
    viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240 // Only compress assets > 10KB
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disabled for Prod performance
    minify: 'esbuild', // Faster than terser
    rollupOptions: {
        output: {
            manualChunks: {
                'react-vendor': ['react', 'react-dom', 'framer-motion'],
                'db-vendor': ['@supabase/supabase-js'],
                'icons': ['lucide-react']
            }
        }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://youagent.top',
        changeOrigin: true,
        secure: false
      }
    }
  }
});