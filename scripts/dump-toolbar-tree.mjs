import { chromium } from "playwright";
const url = process.env.TARGET || "http://localhost:3000/demo-itinerary";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage();
await p.goto(url, { waitUntil: "domcontentloaded" });
await p.waitForSelector('[data-toolbar="true"]', { timeout: 15000 });
const rows = await p.evaluate(() => {
  const tb = document.querySelector('[data-toolbar="true"]');
  return Array.from(tb.children).map((el, idx) => {
    const wrapperSlot = el.getAttribute("data-slot") || "";
    const order = Number(getComputedStyle(el).order || 0);
    const btns = Array.from(el.querySelectorAll('button,[role="button"]')).map((b) => ({
      slot: b.getAttribute("data-slot") || "",
      order: Number(getComputedStyle(b).order || 0),
      text: (b.textContent || "").trim(),
    }));
    return { idx, wrapperSlot, order, btns };
  });
});
console.table(rows);
await b.close();
