import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3001',
  },
  // Next.js devサーバを自動起動（ポート衝突時は再利用）
  webServer: {
    command: 'pnpm dev -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
