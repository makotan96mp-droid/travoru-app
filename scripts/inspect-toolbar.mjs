import { chromium } from "playwright";
const url = process.env.TARGET || "http://localhost:3000/demo-itinerary";

const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage();
await p.goto(url, { waitUntil: "domcontentloaded" });
await p.waitForSelector('[data-toolbar="true"]', { timeout: 15000 });

// slotterの付与を少し待つ
await p
  .waitForFunction(
    () => document.querySelectorAll('[data-toolbar="true"] [data-slot]').length >= 5,
    { timeout: 2000 },
  )
  .catch(() => {});

const rows = await p.evaluate(() => {
  const tb = document.querySelector('[data-toolbar="true"]');
  return Array.from(tb.children).map((el, idx) => {
    const wrapperSlot = el.getAttribute("data-slot") || "";
    const order = Number(getComputedStyle(el).order || 0);
    const tag = el.tagName.toLowerCase();
    const isCustom = tag.includes("-");
    const hasShadowHost = !!el.shadowRoot || isCustom; // おおまかな影響判定
    const btns = Array.from(el.querySelectorAll('button,[role="button"]')).map((b) => ({
      slot: b.getAttribute("data-slot") || "",
      order: Number(getComputedStyle(b).order || 0),
      text: (b.textContent || "").trim().slice(0, 30),
    }));
    return { idx, tag, wrapperSlot, order, hasShadowHost, btnCount: btns.length, btns };
  });
});
console.table(rows);
await b.close();
