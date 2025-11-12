import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { waitDemoReady } from "./helpers";
test("Toolbarの重複ボタンが無いことを確認", async ({ page }) => {
  await waitDemoReady(page as Page);

  // DemoClient側の重複だった [data-today-btn] は 0 個であること
  await expect(page.locator("[data-today-btn]")).toHaveCount(0);

  // 距離トグルは1個のみ（Toolbar本体）
  await expect(page.locator('[title="距離の表示切替"]')).toHaveCount(1);
});
