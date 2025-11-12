import { defineConfig } from "@playwright/test";

export default defineConfig({
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    // ← pnpm 経由でローカルの node_modules/.bin を確実に解決
    command: 'bash -lc "PORT=3001 pnpm run dev:start"',
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
