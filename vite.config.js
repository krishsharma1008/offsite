import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['canvg'], // jspdf optional dependency, not needed for image-only PDFs
  },
  resolve: {
    alias: {
      // Stub out canvg since we don't need SVG support (only using images)
      'canvg': path.resolve(__dirname, 'src/stubs/canvg.js'),
    },
  },
})
