import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { waitDemoReady, openMenu, menuPanelLocator } from "./helpers";

test("メニュー: 共有/カレンダー/印刷/JSON読み込み が並ぶ", async ({ page }) => {
  // print をスタブ & クリップボード/プロンプト/execCommand を記録つきでスタブ
  await page.addInitScript(() => {
    (window as any).__printed = false;
    (window as any).print = () => {
      (window as any).__printed = true;
    };

    (window as any).__clips = [];
    (window as any).__prompts = [];
    (window as any).__execCopies = 0;

    // clipboard.writeText の記録
    try {
      (window as any).navigator.clipboard = {
        writeText: async (t: any) => {
          (window as any).__clips.push(String(t));
        },
      };
    } catch {}

    // prompt フォールバックの記録
    try {
      const origPrompt = window.prompt;
      (window as any).prompt = (msg?: string, _def?: string) => {
        (window as any).__prompts.push(String(msg || ""));
        return ""; // 自動で閉じる
      };
    } catch {}

    // execCommand('copy') フォールバックの記録
    try {
      const origExec = (document as any).execCommand?.bind(document);
      (document as any).execCommand = (cmd: string) => {
        if (String(cmd).toLowerCase() === "copy") (window as any).__execCopies++;
        try {
          return origExec ? origExec(cmd) : true;
        } catch {
          return true;
        }
      };
    } catch {}
  });

  await waitDemoReady(page as Page);
  await expect(await openMenu(page as Page)).toBeTruthy();

  const panel = await menuPanelLocator(page as any);
  await expect(panel).toBeVisible();

  await expect(page.getByTestId("menu-share-link")).toBeVisible();
  await expect(page.getByTestId("menu-calendar")).toBeVisible();
  await expect(page.getByTestId("menu-print")).toBeVisible();
  await expect(page.getByTestId("menu-json-import")).toBeVisible();

  // 共有リンク → clipboard / prompt / execCommand のいずれか発火を検証
  const [c0, p0, e0] = await page.evaluate(() => [
    (window as any).__clips?.length || 0,
    (window as any).__prompts?.length || 0,
    (window as any).__execCopies || 0,
  ]);

  await page.getByTestId("menu-share-link").click();

  await page.waitForFunction(
    (beforeClips, beforePrompts, beforeExec) => {
      const clips = (window as any).__clips;
      const prompts = (window as any).__prompts;
      const execs = (window as any).__execCopies || 0;
      const c = Array.isArray(clips) ? clips.length : 0;
      const p = Array.isArray(prompts) ? prompts.length : 0;
      return c > beforeClips || p > beforePrompts || execs > beforeExec;
    },
    { timeout: 10000 },
    c0,
    p0,
    e0,
  );

  // 取れれば URL も検証（取れないケース＝execCommand のみは回数増加で合格）
  const { copied, prompted, execs } = await page.evaluate(() => ({
    copied: ((window as any).__clips || []).slice(-1)[0] || "",
    prompted: ((window as any).__prompts || []).slice(-1)[0] || "",
    execs: (window as any).__execCopies || 0,
  }));

  if (copied) {
    expect(copied).toMatch(/\/demo-itinerary\?(?:plan|plan_gz)=/);
  } else if (prompted) {
    expect(prompted).toMatch(/\/demo-itinerary\?(?:plan|plan_gz)=/);
  } else {
    expect(execs).toBeGreaterThan(e0); // execCommandのみでもOK
  }

  // 再オープンして印刷 → スタブで確認
  await expect(await openMenu(page as Page)).toBeTruthy();
  await page.getByTestId("menu-print").click();
  await expect
    .poll(async () => await page.evaluate(() => (window as any).__printed === true))
    .toBe(true);
});
