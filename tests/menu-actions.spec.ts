import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { waitDemoReady, openMenu } from "./helpers";

test("メニュー: JSON/共有 クリックでトーストが出る", async ({ page }) => {
  await waitDemoReady(page as Page);
  await expect(await openMenu(page as Page)).toBeTruthy();

  await page.getByTestId("menu-json").click();
  await expect(page.getByRole("status")).toContainText(/JSON/);

  // 再度開いて共有も
  await expect(await openMenu(page as Page)).toBeTruthy();
  await page.getByTestId("menu-share").click();
  await expect(page.getByRole("status")).toContainText(/共有リンク/);
});
