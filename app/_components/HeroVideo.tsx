"use client";
export default function HeroVideo() {
  return (
    <video autoPlay muted loop playsInline preload="metadata"
           style={{ width: "100%", height: "auto", display: "block" }}>
      <source src="/videos/travoru-hero-1080p.webm" type="video/webm" />
      <source src="/videos/travoru-hero-1080p.mp4" type="video/mp4" />
    </video>
  );
}
