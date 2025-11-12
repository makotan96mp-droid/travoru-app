import { defineConfig } from "@playwright/test";
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001", // 既存の Next に接続
  },
  // webServer を定義しない＝Playwrightは何も立ち上げない
});
