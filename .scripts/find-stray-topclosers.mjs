import fs from "fs";
const f = process.argv[2];
const src = fs.readFileSync(f, "utf8");

// 文字列/コメントをスキップしつつ波括弧の深さを追う
let depth = 0,
  inS = null,
  inBL = false,
  inSL = false;
let linesToDelete = new Set();
let line = 1;

for (let i = 0; i < src.length; i++) {
  const c = src[i],
    n = src[i + 1];

  // 改行
  if (c === "\n") {
    line++;
    inSL = false;
    continue;
  }

  // 行コメント
  if (!inS && !inBL && c === "/" && n === "/") {
    inSL = true;
    i++;
    continue;
  }
  if (inSL) continue;

  // ブロックコメント
  if (!inS && !inBL && c === "/" && n === "*") {
    inBL = true;
    i++;
    continue;
  }
  if (inBL && c === "*" && n === "/") {
    inBL = false;
    i++;
    continue;
  }
  if (inBL) continue;

  // 文字列（シングル/ダブル/テンプレート）
  if (!inS && (c === "'" || c === '"' || c === "`")) {
    inS = c;
    continue;
  }
  if (inS) {
    if (c === "\\") {
      i++;
      continue;
    } // エスケープ
    if (c === inS) {
      inS = null;
      continue;
    }
    continue;
  }

  // 括弧バランス処理
  if (c === "{") {
    depth++;
    continue;
  }
  if (c === "}") {
    if (depth === 0) {
      // 深さ0での '}' は不正閉じ。行単位で削除候補に。
      // 末尾が `};` でも同様にその行を消す。
      linesToDelete.add(line);
    } else {
      depth--;
    }
  }
}

if (linesToDelete.size) {
  console.log([...linesToDelete].sort((a, b) => a - b).join(" "));
}
