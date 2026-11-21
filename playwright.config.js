import { defineConfig } from '@playwright/test';

const url = 'http://127.0.0.1:4175';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  use: { baseURL: url, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',
    url,
  },
});
