// app/_components/FullPageVideo.tsx
"use client";
import { useEffect, useRef } from "react";

type Props = { poster?: string };

export default function FullPageVideo({ poster = "/videos/hero-poster.jpg" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) ref.current?.pause();
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <video
        ref={ref}
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={poster} onLoadedData={() => console.log("video loaded")} onError={(e)=>console.error("video error", e.currentTarget.error)}
      >
        <source src="/videos/hero.webm" type="video/webm" />
        <source src="/videos/hero.mp4" type="video/mp4" />
        お使いのブラウザは動画に対応していません。
      </video>
      {/* テキスト可読性を保つための薄いオーバーレイ（濃すぎる場合は数値↓） */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30 pointer-events-none" />
    </div>
  );
}
