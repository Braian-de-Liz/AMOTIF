import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sitemap from 'vite-plugin-sitemap'

// https://vite.dev/config/
export default defineConfig({
  base: 'https://amotif.onrender.com',
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    sitemap({
      hostname: 'https://amotif.onrender.com',
      outDir: 'dist',
      routes: ['/', '/cadastro'],
      exclude: ['/home', '/usuario', '/studio/*', '/convites', '/favoritos'],
    }),
  ],
})
