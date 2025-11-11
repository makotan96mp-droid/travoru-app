import { chromium } from "playwright";

const url = process.env.TARGET || "http://localhost:3000/demo-itinerary";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.goto(url, { waitUntil: "domcontentloaded" });

// ツールバー登場を待つ
await page.waitForSelector('[data-toolbar="true"]', { timeout: 15000 });

const data = await page.evaluate(() => {
  const tb = document.querySelector('[data-toolbar="true"]');
  if (!tb) return { error: "toolbar not found", buttons: [] };

  // ツールバー配下のボタン候補を広めに収集
  const btns = [...tb.querySelectorAll('button,[role="button"]')];

  const simplify = (el) => ({
    tag: el.tagName.toLowerCase(),
    aria: el.getAttribute("aria-label") || "",
    title: el.getAttribute("title") || "",
    role: el.getAttribute("role") || "",
    text: (el.textContent || "").trim().slice(0, 30),
    directChild: el.parentElement === tb,
  });

  // menu っぽい候補（ドット系・More系・日本語ラベル系）を優先表示
  const isMenuLike = (el) => {
    const t = (el.textContent || "").trim();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    const title = (el.getAttribute("title") || "").toLowerCase();
    const dots = ["…", "⋯", "...", "···"];
    const words = ["more", "menu", "options", "more options", "その他", "メニュー"];
    return (
      dots.includes(t) || words.some((w) => aria === w || title === w || t.toLowerCase() === w)
    );
  };

  const all = btns.map(simplify);
  const menuLikes = btns.filter(isMenuLike).map(simplify);

  // data-slot が付いている要素（v2-hybrid 反映済みならここで拾える）
  const slotted = [...tb.querySelectorAll("[data-slot]")].map((el) => ({
    slot: el.getAttribute("data-slot"),
    text: (el.textContent || "").trim().slice(0, 30),
    directChild: el.parentElement === tb,
    order: getComputedStyle(el).order,
    ml: getComputedStyle(el).marginLeft,
  }));

  return { all, menuLikes, slotted };
});

console.log("=== [data-slot] が付いたノード（あれば）===");
console.table(data.slotted);

console.log("=== menu っぽい候補 ===");
console.table(data.menuLikes);

console.log("=== 全ボタン（参考） ===");
console.table(data.all);

await browser.close();
