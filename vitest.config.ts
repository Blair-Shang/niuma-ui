import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'niuma-ui/styles.css': fileURLToPath(new URL('./src/styles/index.css', import.meta.url)),
      'niuma-ui/brand-icons.css': fileURLToPath(
        new URL('./src/icons/style/brand-icon-tokens.css', import.meta.url),
      ),
      'niuma-ui': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'vite-plugins/**/*.spec.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
    testTimeout: 15_000,
  },
})
