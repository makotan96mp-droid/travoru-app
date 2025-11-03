import Image from "next/image";
import FullPageVideo from "./_components/FullPageVideo";
import StickySteps from "./_components/StickySteps";

const DESTS = [
  { href: "/i/tokyo", title: "Tokyo",  desc: "夜景とカルチャー", img: "/images/tokyo.jpeg",  alt: "夜の東京タワーと高層ビル群の夜景" },
  { href: "/i/kyoto", title: "Kyoto",  desc: "歴史と街歩き",       img: "/images/kyoto.jpeg", alt: "京都・八坂の塔へ続く石畳の路地を歩く着物姿の2人" },
  { href: "/i/osaka", title: "Osaka",  desc: "グルメとエネルギー", img: "/images/osaka.jpeg", alt: "青空の下の大阪城と桜並木" },
];

export default function Page() {
  return (
    <main className="hero-container">
  {/* ===== Hero ===== */}
  <section className="relative stretched-container">
    <div className="absolute inset-0 -z-10">
      <FullPageVideo />
    </div>

    <div className="py-28 sm:py-36 px-4 sm:px-8">
      <div className="mx-auto max-w-6xl text-left">
        <h1 className="hero-title text-balance text-hero-glow leading-tightish font-serif text-hero-glow leading-tightish font-serif">
          AIが、あなたの高揚感<br />
      <span className="inline-block whitespace-nowrap sm:whitespace-normal">そのままに旅程を描く。</span>
        </h1>

        <div className="mt-6 text-white/90 text-[15px] sm:text-base font-medium  text-hero-glow leading-relaxed hero-sub hero-sub hero-sub-elevated">
          <div>日程と興味を選ぶだけ</div>
          <div>時間最適のリアルなプランを自動生成</div>
          <div>主要サイトへのリンクですぐに予約完了</div>
        </div>

        <div className="mt-7 flex items-center gap-4">
          <a href="/new"
             className="inline-flex h-10 items-center rounded-full px-5 text-[15px] font-medium
                        text-white bg-black/85 hover:bg-black/90 active:bg-black
                        shadow-[0_6px_20px_rgba(0,0,0,.35)] backdrop-blur lift-1 z-20">
            今すぐプランを作る
          </a>
          <a href="#how-it-works"
             className="inline-flex h-10 items-center rounded-full px-5 text-[15px] font-medium
                        text-white/95 border border-white/30 bg-white/10 hover:bg-white/15
                        shadow-[0_2px_10px_rgba(0,0,0,.25)] backdrop-blur lift-1 z-20">
            使い方を見る
          </a>
        </div>
      </div>
    </div>
  </section>

  {/* ===== How it works（半透明カード） ===== */}
  <StickySteps />


      {/* ===== 人気の目的地 ===== */}
      <section className="my-20 relative z-10 overflow-visible stretched-container">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">人気の目的地</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {DESTS.map((d, i) => (
            <a
              key={d.href}
              href={d.href} aria-label={`${d.title} の詳細へ`}
              className="group relative rounded-lg sm:rounded-xl overflow-hidden border border-white/35 bg-slate-900/60 shadow-[0_20px_40px_rgba(0,0,0,0.28)] ring-1 ring-white/20 transition hover:shadow-md cursor-pointer stretched-container z-20"
            >
              <Image decoding="async" priority={i < 3}
                sizes="(max-width: 640px) 100vw, 33vw" src={d.img}
                alt={d.alt ?? d.title}
                width={1200}
                height={672}
                className="w-full h-48 sm:h-56 object-cover"
               fetchPriority={i < 3 ? "high" : "auto"} />
              <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.28)]">
                <h3 className="text-xl font-semibold">{d.title}</h3>
                <p className="text-sm text-white/80">{d.desc}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8">
          <a href="/new" className="btn z-20">自分の旅程を作る</a>
        </div>
      </section>
</main>
  );
}
