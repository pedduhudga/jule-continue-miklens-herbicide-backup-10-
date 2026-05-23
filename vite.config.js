import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/

// Use environment variables to set the base path conditionally
// GitHub Actions exposes CI=true. When deploying to GH Pages, use the absolute repo path.
// For local dev and Capacitor (Android), use the relative './' path to avoid 404s.
const isGitHubActions = process.env.CI === 'true';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: isGitHubActions ? '/mikherice-10-backup-/' : './',
  build: {

    outDir: 'dist',
    emptyOutDir: true,
  }
})
