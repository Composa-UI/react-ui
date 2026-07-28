/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  // Unit tests live under src/. Playwright specs live in e2e/ (*.spec.ts / *.e2e.ts)
  // and must NOT be collected by vitest — they import @playwright/test.
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
