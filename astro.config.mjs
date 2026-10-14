import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  server: { port: 9204, host: true },
});
