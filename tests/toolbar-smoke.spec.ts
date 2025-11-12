import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  waitDemoReady,
  readLocalStorage,
  openMenu,
  toggleDistance,
  toggleSize,
  dump,
  menuPanelLocator,
  readVariant,
  readDistancePressed,
  closeMenu,
} from "./helpers";

test("距離/サイズ/メニューのスモーク（堅牢版）", async ({ page }) => {
  await waitDemoReady(page as Page);
  await dump(page as Page, "toolbar-smoke-after-ready");

  // 距離
  const beforeDist = await readLocalStorage(page, "travoru.demo.ui.dist");
  const pressedBefore = await readDistancePressed(page as Page);
  await toggleDistance(page as Page);
  const afterDist = await readLocalStorage(page, "travoru.demo.ui.dist");
  const pressedAfter = await readDistancePressed(page as Page);
  expect(afterDist !== beforeDist || pressedAfter !== pressedBefore).toBeTruthy();
  // 表示の大きさ
  const beforeDensity = await readLocalStorage(page, "travoru.demo.ui.density");
  const vBefore = await readVariant(page as Page);
  await toggleSize(page as Page);
  const afterDensity = await readLocalStorage(page, "travoru.demo.ui.density");
  const vAfter = await readVariant(page as Page);
  expect(afterDensity !== beforeDensity || vAfter !== vBefore).toBeTruthy();
  // メニュー
  const opened = await openMenu(page as Page);
  expect(opened).toBeTruthy();
  const panel = page.getByTestId("menu-panel");
  await expect(panel).toBeVisible();
  await page.mouse.click(0, 0);
  await expect(panel).toBeHidden();
});
