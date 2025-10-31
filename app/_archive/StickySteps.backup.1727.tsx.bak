"use client";
import Image from "next/image";
import { useInView } from "framer-motion";
import { useRef } from "react";

type Step = { title: string; body: string; image: string; alt: string };

const STEPS: Step[] = [
  {
   id: 1,
    title: "Step 1 — 入力",
    body: "都市・日付・興味をさっと選択。\n30秒で入力完了。",
    image: "/shots/new-form.jpg",       // ← ここを差し替え
    alt: "入力フォーム画面のスクリーンショット",
  },
  {
    id: 2,
    title: "Step 2 — 生成",
    body: "移動時間・混雑・屋内外を考慮して、無理のないプランへ。",
    image: "/shots/itinerary-top.jpg",  // ← ここを差し替え
    alt: "旅程プレビューのスクリーンショット",
  },
  {
    id: 3,
    title: "Step 3 — 予約導線",
    body: "主要予約サイト（Booking・Agoda・Trip.com・楽天トラベル）にワンタップ。\n無料キャンセル可のプランを優先。",
    image: "/shots/booking-links.jpg",      // ← ここを差し替え
    alt: "予約導線のスクリーンショット",
  },
];

export default function StickySteps() {
  // 最初のステップが画面に入ったら淡く立体感を付ける
  const firstRef = useRef<HTMLDivElement>(null);
  const firstInView = useInView(firstRef, { margin: "-10% 0px -80% 0px" });

  return (
    <section id="how" className="relative z-10 bg-neutral-50/90 backdrop-blur-sm">
      <div className="container py-20">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-6">How it works</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左カラム：ステップ説明（スクロールしても見やすいように sticky） */}
          <aside className="md:sticky md:top-24 h-fit">
            <div
              className={
                "card p-6 transition-shadow " +
                (firstInView ? "shadow-xl" : "shadow-none")
              }
            >
              <ol className="space-y-5 text-sm text-neutral-700">
                {STEPS.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-neutral-600 whitespace-pre-line">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6">
                <a href="/new" className="btn self-start mt-4 w-auto">今すぐ試す</a>
              </div>
            </div>
          </aside>

          {/* 右カラム：スクショ（各カードが順に現れる） */}
          <div className="space-y-8">
            {STEPS.map((s, i) => (
              <div
                key={i}
                ref={i === 0 ? firstRef : undefined}
                className="card p-0 overflow-hidden"
              >
                <div className="p-5">
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-[15px] sm:text-base leading-relaxed text-neutral-800">{s.body}</p>
                </div>
                <div className="bg-white">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    width={1600}
                    height={900}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className=" h-auto"
                    priority={i === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
