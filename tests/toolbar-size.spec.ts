import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { waitDemoReady, readLocalStorage, toggleSize, dump } from "./helpers";

test("表示の大きさボタンで cozy/compact が切り替わる（localStorage基準）", async ({ page }) => {
  await waitDemoReady(page as Page);
  await dump(page as Page, "toolbar-size-after-ready");

  const before = await readLocalStorage(page, "travoru.demo.ui.density");
  const vBefore = await (await import("./helpers")).readVariant(page as Page);

  await toggleSize(page as Page);

  const after = await readLocalStorage(page, "travoru.demo.ui.density");
  const vAfter = await (await import("./helpers")).readVariant(page as Page);

  // localStorage か data-variant のどちらかが変化していれば合格
  expect(after !== before || vAfter !== vBefore).toBeTruthy();
});
