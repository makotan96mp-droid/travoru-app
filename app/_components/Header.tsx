"use client";
import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur border-b border-white/10">
      {/* 高さは最小限：モバイル h-12 / PC h-12 sm:h-14 */}
      <div className="mx-auto max-w-6xl px-4 h-12 sm:h-12 sm:h-14 flex items-center justify-between">
        {/* ロゴ：大きめ + 行高ゼロで上下の余白を消す */}
        <a href="/" className="flex items-center gap-2 leading-none leading-none" aria-label="Travoru">
          <Image decoding="async" src="/logo.png"  /* 自動検出で書き換えているならそのパスに合わせてOK */
            alt="Travoru"
            width={160}  /* 目安：横幅は自動縮小されるので気にしなくてOK */
            height={40} priority
            className="h-9 sm:h-10 w-auto select-none drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] leading-none"
          />
        </a>

        {/* 右ナビは小さめにしてロゴを主役に */}
        <nav aria-label="主要ナビ" className="flex items-center gap-3 text-xs sm:text-xs sm:text-sm opacity-85">
          <a href="/about" className="hover:opacity-100 leading-none">使い方</a>
          <a
            href="/new"
            className="leading-none inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 hover:bg-white/15"
          >
            今すぐプランを作る
          </a>
        </nav>
      </div>
    </header>
  );
}
