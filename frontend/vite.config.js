import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration with React plugin.
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@react-three') || id.includes('/three/') || id.includes('\\three\\') || id.includes('postprocessing')) {
            return 'three-vendor';
          }
          if (id.includes('framer-motion') || id.includes('gsap')) {
            return 'motion-vendor';
          }
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          if (id.includes('react-icons')) {
            return 'icons-vendor';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173
  }
});
