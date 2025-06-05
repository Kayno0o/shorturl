import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'
// @ts-check
import { defineConfig } from 'astro/config'

import { loadEnv } from 'vite'

import './src/libs/init'

const { APP_URL } = loadEnv(String(process.env.NODE_ENV), process.cwd(), '')

// https://astro.build/config
export default defineConfig({
  output: 'server',

  vite: {
    server: {
      allowedHosts: [APP_URL],
    },

    plugins: [tailwindcss()],
  },

  adapter: node({
    mode: 'standalone',
  }),
})
