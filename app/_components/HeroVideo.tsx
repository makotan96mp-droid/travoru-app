// app/_components/HeroVideo.tsx
"use client";
import { useEffect, useRef } from "react";

type Props = {
  /** スマホ等で動画の代わりに表示する静止画（public/ からのパス） */
  poster?: string; // 例: "/videos/hero-poster.jpg"
  /** 外側ラッパーの任意クラス（高さや位置の微調整用） */
  className?: string;
};

/**
 * ヒーロー動画コンポーネント
 * - デスクトップ/タブレット: 動画再生
 * - モバイル: ポスター静止画（通信量/電池配慮）
 * - OSの「動きを減らす」設定: 自動で一時停止
 * - 文字可読性のため暗めグラデ重ね
 */
export default function HeroVideo({
  poster = "/videos/hero-poster.jpg",
  className = "",
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) {
      // 動きを減らす設定のユーザーには自動再生を止める
      ref.current?.pause();
    }
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* デスクトップ/タブレットでは動画 */}
      <video
        ref={ref}
        className="hidden sm:block h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
      >
        {/* どちらか片方でもOK。用意できた形式だけ残して下さい */}
        <source src="/videos/hero.webm" type="video/webm" />
        <source src="/videos/hero.mp4" type="video/mp4" />
        お使いのブラウザは動画に対応していません。
      </video>

      {/* モバイルは軽量なポスター静止画に切り替え */}
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className="sm:hidden h-full w-full object-cover"
        loading="eager"
      />

      {/* 文字の可読性UP用の暗めグラデ（少し濃いめ） */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none" />
    </div>
  );
}
