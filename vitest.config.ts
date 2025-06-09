/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/webpack.*',
        'src/main.ts', // electron main process
        'src/preload.ts', // electron preload
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/renderer': path.resolve(__dirname, './src/renderer'),
      '@/main': path.resolve(__dirname, './src/main'),
              '@/shared': path.resolve(__dirname, './src/shared'),
        '@/features': path.resolve(__dirname, './src/renderer/features'),
      '@/hooks': path.resolve(__dirname, './src/renderer/hooks'),
      '@/services': path.resolve(__dirname, './src/renderer/services'),
      '@/stores': path.resolve(__dirname, './src/renderer/stores'),
      '@/utils': path.resolve(__dirname, './src/renderer/utils'),
      '@/types': path.resolve(__dirname, './src/shared/types'),
    },
  },
}); 