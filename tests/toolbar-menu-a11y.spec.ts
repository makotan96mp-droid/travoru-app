import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { waitDemoReady, openMenu, dump, menuPanelLocator, closeMenu } from "./helpers";

test("メニュー: aria-expanded/ESC/外側クリック", async ({ page }) => {
  await waitDemoReady(page as Page);
  await dump(page as Page, "toolbar-menu-a11y-after-ready");

  const opened = await openMenu(page as Page);
  if (!opened) {
    await dump(page as Page, "menu-not-found");
    throw new Error("menu button not found");
  }
  const menuBtn = page.getByTestId("menu-btn");
  await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

  const panel = page.getByTestId("menu-panel");
  await expect(panel).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

  await expect(await openMenu(page as Page)).toBeTruthy();
  await expect(panel).toBeVisible();
  await page.mouse.click(0, 0);
  await expect(panel).toBeHidden();
});
