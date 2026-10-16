import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Deployed under https://baramarsahar-slt.github.io/osec-calc/
  base: '/osec-calc/',
  plugins: [react(), tailwindcss()],
})
