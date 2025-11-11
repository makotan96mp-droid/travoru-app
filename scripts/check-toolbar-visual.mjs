import { chromium } from "playwright";
const url = process.env.TARGET || "http://localhost:3000/demo-itinerary";

const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage();
await p.goto(url, { waitUntil: "domcontentloaded" });
await p.waitForSelector('[data-toolbar="true"]', { timeout: 15000 });

// slotter が data-slot を付け終えるまで軽く待つ
await p
  .waitForFunction(
    () => {
      const tb = document.querySelector('[data-toolbar="true"]');
      return tb && tb.querySelectorAll(':is(button,[role="button"])[data-slot]').length >= 5;
    },
    { timeout: 2000 },
  )
  .catch(() => {});

const rows = await p.evaluate(() => {
  const tb = document.querySelector('[data-toolbar="true"]');

  const list = [];

  // 1) すべての「data-slot 付きボタン」を個別に採取（ラッパー無視）
  tb.querySelectorAll(':is(button,[role="button"])[data-slot]').forEach((el) => {
    const r = el.getBoundingClientRect();
    list.push({
      slot: el.getAttribute("data-slot") || "",
      left: r.left,
      top: r.top,
      text: (el.textContent || "").trim().slice(0, 30),
    });
  });

  // 2) ボタンでない move/menu は、直下ラッパーを採取
  const moveWrap = tb.querySelector(':scope > [data-slot="move"]');
  if (moveWrap) {
    const r = moveWrap.getBoundingClientRect();
    list.push({
      slot: "move",
      left: r.left,
      top: r.top,
      text: (moveWrap.textContent || "").trim().slice(0, 30),
    });
  }
  const menuWrap = tb.querySelector(':scope > [data-slot="menu"]');
  if (menuWrap) {
    const r = menuWrap.getBoundingClientRect();
    list.push({
      slot: "menu",
      left: r.left,
      top: r.top,
      text: (menuWrap.textContent || "").trim().slice(0, 30),
    });
  }

  list.sort((a, b) => a.top - b.top || a.left - b.left);
  return list;
});

console.log("VISUAL ORDER:", rows.map((r) => r.slot).join(" | "));
console.table(rows);
await b.close();
