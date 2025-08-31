import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig(({ mode }) => ({
  plugins: [svelte()],
  resolve: {
    conditions: mode === 'test' ? ['browser'] : [],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'webviews/**/*.test.{js,ts,svelte}',
      'node_modules/@vscode/codicons/dist/codicon.css',
    ],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/vitest.setup.ts'],
    },
  },
}))
