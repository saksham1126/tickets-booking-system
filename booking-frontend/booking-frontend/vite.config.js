import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // sockjs-client assumes a Node.js-style 'global' object exists, which
  // Vite doesn't provide by default (Webpack used to polyfill this
  // automatically). Without this, importing sockjs-client crashes with
  // "ReferenceError: global is not defined" before React even renders.
  define: {
    global: 'globalThis',
  },
})
