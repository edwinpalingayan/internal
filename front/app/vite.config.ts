import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    {
      name: 'log-on-start',
      configResolved(config) {
        console.log('Vite config resolved:', config);
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 80,
    watch: {
      usePolling: true,
    },
    hmr: {
      port: 80,
    },
    proxy: {
      '/api': {
        // Dockerのコンテナ名を指定すること
        target: process.env.VITE_PROXY_URL || '/',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('  Proxying request:')
            console.log('  Original URL:', req.url)
            console.log('  Target:', `${options.target}${proxyReq.path}`)
            console.log('  Method:', proxyReq.method)
            console.log('  Headers:', proxyReq.getHeaders())
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('  Proxy response:')
            console.log('  Status:', proxyRes.statusCode)
            console.log('  From:', `${options.target}${(req.url ?? '').replace('/api', '')}`)
          })
          proxy.on('error', (err,) => {
            console.log('  Proxy error:', err.message)
          })
        }
      },
    },
  },
});
