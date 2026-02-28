import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      tailwindcss(),
      react(),
      // Brotli compression — best compression ratio, supported by all modern browsers
      compression({ algorithms: ['brotliCompress'], exclude: [/\.(png|jpg|gif|webp|avif|svg)$/] }),
      // Gzip fallback for older clients
      compression({ algorithms: ['gzip'], exclude: [/\.(png|jpg|gif|webp|avif|svg)$/] }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 3000,
    }
  };
});
