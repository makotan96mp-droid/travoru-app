import ItineraryForm from "@/_components/ItineraryForm";
import ThemeToggle from "@/_components/ThemeToggle";

export const metadata = {
  title: "旅程の作成 — Travoru",
  description: "都市と日付、ざっくり希望と行きたい場所を入れて、旅程プレビューを生成します。",
  robots: "index, follow",
};

export default function NewPlanPage() {
  return (
    <main className="min-h-dvh p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <header className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold">自分の旅程を作る</h1>
            <p className="text-[color:var(--fg-muted)] max-w-prose">
              都市／日付／ざっくり希望を選んで、行きたい場所を入れるだけ。まずは無料プレビューで雰囲気を確認。
            </p>
          </header>
          <ThemeToggle />
        </div>
        <ItineraryForm />
      </div>
    </main>
  );
}
