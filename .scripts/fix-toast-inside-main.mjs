import fs from "fs";
const f = "app/demo-itinerary/DemoClient.tsx";
let s = fs.readFileSync(f, "utf8");

// すでに <main> の外に {toast ? (...) : null} があるケースを検出して内側へ移動
const pattern = /<\/main>\s*\n\s*\{toast\s*\?\s*\([\s\S]*?\)\s*:\s*null\}\s*\n(\s*\)\s*;)/m;
if (pattern.test(s)) {
  s = s.replace(
    pattern,
    (m, close) =>
      `      {toast ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 rounded-xl bg-black/80 text-white text-sm px-4 py-2 shadow-lg z-50">{toast}</div>
      ) : null}
      </main>
${close}`,
  );
  fs.writeFileSync(f, s);
  console.log("✅ Moved toast into <main> (single-root return fixed)");
} else {
  console.log("ℹ️ No external toast block found — nothing to change");
}
