import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const r = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'chrome110',
    rollupOptions: {
      input: {
        popup: r('./src/popup/popup.html'),
        'service-worker': r('./src/background/service-worker.ts'),
        'content/extractor': r('./src/content/extractor.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
