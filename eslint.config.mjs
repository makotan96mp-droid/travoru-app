import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";

/** ESLint v9 flat config (TypeScript & Next.js 向け最適化版) */
export default [
  // v9は .eslintignore 非推奨。ここで集中管理
  {
    ignores: [
      ".next/**",
      ".tmp/**",
      ".backup/**",
      "**/playwright-transform-cache-*/**",
      "node_modules/**",
    ],
  },

  // ベース推奨
  ...tseslint.configs.recommended, // TS向け（no-undef等のJSルールはTSで置き換え）
  js.configs.recommended,

  // 共通（全ファイル）
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    plugins: {
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // 使ってない変数はまずは警告に（先に開発を進めやすく）
      "no-unused-vars": "off", // JS版はoffにして…
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // 空ブロックや到達不能は一旦ワーニングに（後で戻す）
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-unreachable": "warn",
    },
  },

  // TypeScriptファイルでは no-undef を無効化（型名に誤反応するため）
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-undef": "off",
    },
    languageOptions: {
      // ブラウザ & Node の代表的なグローバルを宣言（JSX/SSR混在のため広めに）
      globals: {
        // ブラウザ
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        fetch: "readonly",
        console: "readonly",
        // DOM型（TSでは型位置だが no-undefの誤検知対策）
        HTMLDivElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLVideoElement: "readonly",
        // SSR/Nodeサイド
        process: "readonly",
        // 新JSXランタイムでも稀に誤検知される環境向け
        React: "readonly",
      },
    },
  },

  // app & tests では一旦 any と Link強制を緩める
  {
    files: ["app/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },

  // API/スクリプトは Node グローバルに寄せる（必要十分）
  {
    files: ["app/api/**/*.{ts,tsx}", "scripts/**/*.{js,ts,mjs,cjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "import/no-commonjs": "off",
    },
  },
];
