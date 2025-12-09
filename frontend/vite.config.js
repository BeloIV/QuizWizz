import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Determine backend URL based on hostname
const getProxyTarget = () => {
  // In Docker container, use the service name
  if (process.env.VITE_PROXY_TARGET) {
    return process.env.VITE_PROXY_TARGET;
  }
  // For local development, use localhost or local IP
  return 'http://localhost:8080';
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'quiz.bytboyzserver.xyz',
      'localhost',
      '127.0.0.1',
      '.bytboyzserver.xyz'
    ],
    proxy: {
      '/api': {
        target: getProxyTarget(),
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/media': {
        target: getProxyTarget(),
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    },
    watch: {
      usePolling: true
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  }
})
