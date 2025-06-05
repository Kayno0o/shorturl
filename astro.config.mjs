// @ts-check
import { defineConfig } from 'astro/config'

import { loadEnv } from 'vite'

import node from '@astrojs/node';

const { APP_URL } = loadEnv(String(process.env.NODE_ENV), process.cwd(), '')

// https://astro.build/config
export default defineConfig({
  output: 'server',

  vite: {
    server: {
      allowedHosts: [APP_URL],
    },
  },

  adapter: node({
    mode: 'standalone',
  }),
})