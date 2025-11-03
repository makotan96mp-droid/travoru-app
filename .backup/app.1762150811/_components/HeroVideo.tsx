"use client";
export default function HeroVideo() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* 最高画質を先頭に（ブラウザは再生可能な最初のsourceを選びます） */}
      <source src="/videos/travoru-hero-4k.mp4" type="video/mp4" />
      お使いのブラウザは動画タグに対応していません。
    </video>
  );
}
