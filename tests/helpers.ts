import type { Page, Locator } from "@playwright/test";
import * as fsp from "node:fs/promises";

// ---- seed ----
function seedPlanBase64() {
  const payload = {
    date: new Date().toISOString().slice(0, 10),
    items: [
      { time: "09:00", title: "駅 → 観光A", tags: ["transfer"], meta: { dayOffset: 0 } },
      { time: "12:00", title: "昼食", meta: { dayOffset: 0 } },
      { time: "15:00", title: "観光B", meta: { dayOffset: 0 } },
      { time: "18:00", title: "夕食", meta: { dayOffset: 0 } },
    ],
    ui: { density: "cozy", showDistance: true },
  };
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ---- diagnostics / dump ----
export async function hookDiagnostics(page: Page) {
  await fsp.mkdir(".tmp", { recursive: true });
  const logs: string[] = [];
  page.on("console", (m) => logs.push(`[console][${m.type()}] ${m.text()}`));
  page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));
  page.on("requestfailed", (r) =>
    logs.push(`[requestfailed] ${r.failure()?.errorText} ${r.url()}`),
  );
  (page as any).__diagLogs = logs;
}

export async function dump(page: Page, name = "last") {
  try {
    await fsp.mkdir(".tmp", { recursive: true });
    await fsp.writeFile(`.tmp/${name}.html`, await page.content());
    await page.screenshot({ path: `.tmp/${name}.png`, fullPage: true }).catch(() => {});
    const logs: string[] = (page as any).__diagLogs || [];
    await fsp.writeFile(`.tmp/${name}.log`, logs.join("\n"));
  } catch {}
}

// ---- wait ready ----
export async function waitDemoReady(page: Page): Promise<void> {
  await hookDiagnostics(page);
  const url = `/demo-itinerary?plan=${seedPlanBase64()}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });

  try {
    await page.waitForSelector("text=Loading itinerary…", { state: "detached", timeout: 60_000 });
  } catch {}

  const waitAny = (timeout: number) =>
    Promise.any([
      page.waitForSelector("[data-toolbar]", { state: "visible", timeout }),
      page.waitForSelector("section[data-variant]", { state: "attached", timeout }),
      page.locator('[data-slot="distance"]').waitFor({ state: "visible", timeout }),
      page.locator('[data-slot="size"]').waitFor({ state: "visible", timeout }),
      page.getByRole("button", { name: "距離の表示切替" }).waitFor({ state: "visible", timeout }),
      page.getByRole("button", { name: "表示の大きさ" }).waitFor({ state: "visible", timeout }),
    ]);

  try {
    await waitAny(60_000);
  } catch {
    await dump(page, "wait-timeout-before-reload");
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
    } catch {}
    try {
      await waitAny(40_000);
    } catch (e) {
      await dump(page, "wait-timeout-after-reload");
      throw e;
    }
  }

  await page.waitForTimeout(120);
}

// ---- helpers for click / fallback ----
async function firstExisting(page: Page, locs: Locator[]): Promise<Locator | null> {
  for (const loc of locs) {
    try {
      if ((await loc.count()) > 0) return loc.first();
    } catch {}
  }
  return null;
}

async function tryClickCandidates(page: Page, locs: Locator[]): Promise<boolean> {
  const loc = await firstExisting(page, locs);
  if (!loc) return false;
  try {
    await loc.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
    await loc.click({ timeout: 8_000 });
    return true;
  } catch {
    const h = await loc.elementHandle().catch(() => null);
    if (h) {
      await h.evaluate((el: HTMLElement) => {
        try {
          el.scrollIntoView({ block: "center", inline: "center" });
        } catch {}
        el.click();
      });
      return true;
    }
    return false;
  }
}

// ---- Action API: click or storage toggle ----
export async function toggleDistance(page: Page): Promise<void> {
  const clicked = await tryClickCandidates(page, [
    page.locator('[data-slot="distance"]'),
    page.getByRole("button", { name: "距離の表示切替" }),
    page.locator('button[title="距離の表示切替"]'),
  ]);
  if (clicked) return;

  await page.evaluate(() => {
    const k = "travoru.demo.ui.dist";
    const cur = localStorage.getItem(k);
    localStorage.setItem(k, cur === "0" ? "1" : "0");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: k,
        newValue: localStorage.getItem(k)!,
        oldValue: cur ?? null,
      }),
    );
  });
}

export async function toggleSize(page: Page): Promise<void> {
  const clicked = await tryClickCandidates(page, [
    page.locator('[data-slot="size"]'),
    page.getByRole("button", { name: "表示の大きさ" }),
  ]);
  if (clicked) return;

  await page.evaluate(() => {
    const k = "travoru.demo.ui.density";
    const cur = localStorage.getItem(k) || "cozy";
    const next = cur === "cozy" ? "compact" : "cozy";
    localStorage.setItem(k, next);
    window.dispatchEvent(new StorageEvent("storage", { key: k, newValue: next, oldValue: cur }));
  });
}

export async function openMenu(page: Page): Promise<boolean> {
  const locs = [
    page.getByTestId("menu-btn"),
    page.locator('button[aria-haspopup="menu"]'),
    page.getByRole("button", { name: /メニュー|menu/i }),
    page.locator('[data-slot="menu"] :is(button,a[role="button"])'),
    page.locator('[aria-controls="menu-panel"]'),
  ];
  for (const l of locs) {
    try {
      if ((await l.count()) > 0) {
        await l.first().click();
        return true;
      }
    } catch {}
  }
  return false;
}

// どの実装でも menu panel を見つけるロケータ
export async function menuPanelLocator(page: Page): Promise<Locator> {
  const cands: Locator[] = [
    page.locator('#menu-panel-content[data-testid="menu-panel"]'),
    page.getByTestId("menu-panel"),
    page.locator('#menu-panel[role="menu"]'),
    page.getByRole("menu"),
  ];
  for (const l of cands) {
    try {
      if ((await l.count()) > 0) return l.first();
    } catch {}
  }
  return page.getByTestId("menu-panel"); // 最後のフォールバック
}

export async function readLocalStorage(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

export async function readVariant(page: Page): Promise<string | null> {
  const sec = page.locator("section[data-variant]").first();
  try {
    await sec.waitFor({ state: "attached", timeout: 5000 });
  } catch {}
  try {
    return await sec.getAttribute("data-variant");
  } catch {
    return null;
  }
}

export async function readDistancePressed(page: Page): Promise<string | null> {
  const btn = page.locator('[data-slot="distance"]').first();
  try {
    await btn.waitFor({ state: "attached", timeout: 5000 });
  } catch {}
  try {
    return await btn.getAttribute("aria-pressed");
  } catch {
    return null;
  }
}

export async function closeMenu(page: Page): Promise<void> {
  const panel = await menuPanelLocator(page as any);

  // 1) ESC
  await page.keyboard.press("Escape").catch(() => {});
  try {
    await panel.waitFor({ state: "hidden", timeout: 800 });
    return;
  } catch {}

  // 2) 画面外側を数点クリック
  const vp = page.viewportSize() || { width: 1280, height: 800 };
  const pts: Array<[number, number]> = [
    [5, 5],
    [Math.max(5, Math.floor(vp.width / 2)), 5],
    [5, Math.max(5, Math.floor(vp.height / 2))],
    [Math.max(5, vp.width - 10), 5],
  ];
  for (const [x, y] of pts) {
    try {
      await page.mouse.click(x, y);
      await panel.waitFor({ state: "hidden", timeout: 800 });
      return;
    } catch {}
  }

  // 3) トグル再クリック（通常→JS直接）
  const btnLocs = [
    page.getByTestId("menu-btn"),
    page.locator('button[aria-haspopup="menu"]'),
    page.getByRole("button", { name: /メニュー|menu/i }),
    page.locator('[data-slot="menu"] :is(button,a[role="button"])'),
    page.locator('[aria-controls="menu-panel"]'),
  ];
  for (const l of btnLocs) {
    try {
      if ((await l.count()) > 0) {
        const btn = l.first();
        await btn.click({ timeout: 800 }).catch(() => {});
        try {
          await panel.waitFor({ state: "hidden", timeout: 800 });
          return;
        } catch {}
        const h = await btn.elementHandle().catch(() => null);
        if (h) {
          await h.evaluate((el: HTMLElement) => el.click());
          try {
            await panel.waitFor({ state: "hidden", timeout: 800 });
            return;
          } catch {}
        }
      }
    } catch {}
  }
}
