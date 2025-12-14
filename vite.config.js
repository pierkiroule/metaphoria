import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Target an older ECMAScript baseline so optional chaining and other modern
  // syntax get transpiled for WebViews/browsers that would otherwise fail at
  // parse time and render a blank screen.
  build: {
    target: 'es2017',
  },
  esbuild: {
    target: 'es2017',
  },
})
