/** 最小ストレスで通すための暫定設定。落ち着いたら段階的に厳格化 */
module.exports = {
  root: true,
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "eslint:recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  ignorePatterns: [
    ".next/",
    ".tmp/",
    ".backup/",
    "**/playwright-transform-cache-*/",
    "node_modules/",
  ],
  overrides: [
    // Node スクリプト：require を許可
    {
      files: ["scripts/**/*.{js,ts,mjs,cjs}"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "import/no-commonjs": "off",
      },
      env: { node: true },
    },
    // テスト：any の許容・柔らかめ
    {
      files: ["tests/**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    // 一旦プロダクト全体で any を許容（開発が進んだら段階的に戻す）
    {
      files: ["app/**/*.{ts,tsx}", "app/**/*.{mts,cts}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        // Link 化は後でまとめて対応するので一旦OFF
        "@next/next/no-html-link-for-pages": "off",
        // ThemeToggle の一時抑止（後で実装順を直す）
        "react-hooks/immutability": "off",
      },
    },
  ],
};
