import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT || "3100";
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: BASE, // page.goto('/') が BASE に通る
    trace: "on-first-retry",
  },
  webServer: {
    command: `PORT=${PORT} pnpm next dev -p ${PORT}`,
    url: BASE,
    reuseExistingServer: true, // 既に起動してたら再利用
    timeout: 120_000,
    env: { TMPDIR: `${process.cwd()}/.tmp` }, // 変換キャッシュをプロジェクト内に
  },
});
