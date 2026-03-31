import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'

const gitHash = execSync('git rev-parse --short HEAD').toString().trim()

export default defineConfig({
  define: {
    __BUILD_HASH__: JSON.stringify(gitHash),
  },
  plugins: [react(), tailwindcss()],
  build: {
    // Disable modulepreload entirely — prevents Vite from injecting
    // __vitePreload helper that creates cross-chunk deps with Three.js
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vite's preload helper — must stay in vendor so index doesn't
          // pull in r3f/three just for this function
          if (id.includes('vite/preload-helper') ||
              id.includes('vite/modulepreload-polyfill')) {
            return 'vendor'
          }
          // React core + router + state — needed by ALL pages
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/zustand/') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/use-sync-external-store/')) {
            return 'vendor'
          }
          // Three.js — only needed when 3D renders
          if (id.includes('node_modules/three/')) {
            return 'three'
          }
          // Postprocessing — only needed when bloom is active
          if (id.includes('node_modules/postprocessing/') ||
              id.includes('node_modules/@react-three/postprocessing/')) {
            return 'postprocessing'
          }
          // R3F + drei + reconciler — only needed when 3D renders
          if (id.includes('node_modules/@react-three/fiber/') ||
              id.includes('node_modules/@react-three/drei/') ||
              id.includes('node_modules/react-reconciler/') ||
              id.includes('node_modules/its-fine/')) {
            return 'r3f'
          }
        },
      },
    },
  },
})
