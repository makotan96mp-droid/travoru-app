import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { waitDemoReady, openMenu, menuPanelLocator } from "./helpers";

test("メニュー: JSON/共有リンクボタンが表示される", async ({ page }) => {
  await waitDemoReady(page as Page);
  await expect(await openMenu(page as Page)).toBeTruthy();

  const panel = await menuPanelLocator(page as any);
  await expect(panel).toBeVisible();
  await expect(page.getByTestId("menu-json")).toBeVisible();
  await expect(page.getByTestId("menu-share")).toBeVisible();
});
