import { defineConfig } from 'vite';
import { reactRouter } from "@react-router/dev/vite";
import viteCompression from 'vite-plugin-compression';
import { partytownVite } from '@builder.io/partytown/utils';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRouter(),
    partytownVite({ dest: path.resolve('public', '~partytown') }),
    // Protocol V15.0: Asset Compression (Brotli + Gzip fallback)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240
    })
  ],
  ssr: {
    target: "webworker",
    noExternal: ["@react-router/*", "react-router", "react-router-dom"]
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true, // Per-route CSS splitting
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'react-player']
  },
  optimizeDeps: {
    include: ['react-helmet-async', 'react-router', 'react-router-dom', 'react-player']
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
