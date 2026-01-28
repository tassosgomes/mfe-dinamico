import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'sales_app',
      filename: 'remoteEntry.js',
      exposes: {
        './SalesApp': './src/App.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
      },
    }),
  ],
  server: {
    port: 5175,
    strictPort: true,
    cors: true,
  },
  build: {
    target: 'esnext',
  },
  esbuild: {
    target: 'esnext',
  },
});
