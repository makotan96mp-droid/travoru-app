"use client";
export default function FullPageVideo() {
  return (
    <div style={{position:"relative", width:"100%", overflow:"hidden"}}>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/hero-poster.jpg"
        style={{ width:"100%", height:"auto", display:"block" }}
      >
        {/* ブラウザは最初に再生可能な source を使う。4Kを先頭に */}
        <source src="/videos/travoru-hero-4k.mp4?v=20251102" type="video/mp4" />
        お使いのブラウザは動画タグに対応していません。
      </video>
    </div>
  );
}
