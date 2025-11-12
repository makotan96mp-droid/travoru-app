import { chromium } from "playwright";
const url = process.env.TARGET || "http://localhost:3000/demo-itinerary";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-toolbar="true"]', { timeout: 15000 });

await page.addStyleTag({
  content: `
  [data-toolbar="true"] [data-slot],
  [data-toolbar="true"] button[aria-label],
  [data-toolbar="true"] button {
    outline-offset: 2px !important;
  }
`,
});

await page.evaluate(() => {
  const tb = document.querySelector('[data-toolbar="true"]');
  if (!tb) return;
  const mark = (el, color) => {
    el.style.outline = `2px solid ${color}`;
  };
  // 既知の menu 条件
  tb.querySelectorAll(
    '[aria-label="その他"],[aria-label="メニュー"],[aria-label="More"],[aria-label="Menu"]',
  ).forEach((el) => mark(el, "red"));
  // ドット表記など
  tb.querySelectorAll('button,[role="button"]').forEach((el) => {
    const t = (el.textContent || "").trim();
    if (["…", "⋯", "...", "···", "More", "メニュー", "その他"].includes(t)) mark(el, "red");
  });
});

await page.screenshot({ path: "toolbar-highlight.png" });
await browser.close();
