import Image from "next/image";

export default function Logo({ className = "h-7" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="Travoru">
      {/* 画像ロゴ（高さ 28px）。dark 背景でも埋もれにくいよう軽い影を付与 */}
      <Image
        src="/logo.png"
        alt="Travoru"
        width={140}
        height={28}
        className={`w-auto ${className} drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]`}
      />
    </div>
  );
}
