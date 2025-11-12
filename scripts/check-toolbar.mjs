import { chromium } from "playwright";

const url = process.env.TARGET || "http://localhost:3000/demo-itinerary";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage();
await p.goto(url, { waitUntil: "domcontentloaded" });
await p.waitForSelector('[data-toolbar="true"]', { timeout: 15000 });

// ✅ slotter が data-slot を付けるのを少し待つ（最大 2s）
await p
  .waitForFunction(
    () =>
      document.querySelectorAll('[data-toolbar="true"] :is(button,[role="button"])[data-slot]')
        .length >= 1,
    { timeout: 2000 },
  )
  .catch(() => {
    /* 付かなくても続行 */
  });

const data = await p.evaluate(() => {
  const tb = document.querySelector('[data-toolbar="true"]');
  const btns = Array.from(tb.querySelectorAll('button,[role="button"]'));

  const text = (el) => (el.textContent || "").trim();
  const title = (el) => (el.getAttribute("title") || "").trim();
  const aria = (el) => (el.getAttribute("aria-label") || "").trim().toLowerCase();

  // ✅ data-slot を最優先で使い、無ければヒューリスティック
  const slotOf = (el) =>
    el.getAttribute("data-slot") ||
    (title(el) === "表示の大きさ" && "size") ||
    ((title(el) === "距離の表示切替" || /^距離\s/.test(text(el))) && "distance") ||
    ((title(el) === "今日の日付にする" || text(el) === "今日") && "today") ||
    ((/^[＋+]\s*予定を追加$/.test(text(el)) || title(el) === "予定を追加") && "add") ||
    (text(el) === "Reset" && "reset") ||
    ((aria(el).includes("menu") || /メニュー|More/i.test(text(el))) && "menu") ||
    "";

  const rows = btns
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        slot: slotOf(el),
        order: getComputedStyle(el).order,
        right: r.right,
        text: text(el).slice(0, 30),
      };
    })
    .filter((r) => r.slot);

  const maxRight = Math.max(...rows.map((r) => r.right));
  const menuRow = rows.find((r) => r.slot === "menu");
  const menuRight = !!menuRow && maxRight - menuRow.right < 2; // 右端±2px

  return { rows, menuRight };
});

console.table(data.rows);
console.log("VERDICT:", {
  hasAll: ["reset", "add", "today", "size", "distance"].every((s) =>
    data.rows.some((r) => r.slot === s),
  ),
  menuRight: data.menuRight,
  orders: data.rows
    .filter((r) => ["reset", "add", "today", "size", "distance", "move", "menu"].includes(r.slot))
    .map((r) => ({ slot: r.slot, order: Number(r.order) })),
});

await b.close();
