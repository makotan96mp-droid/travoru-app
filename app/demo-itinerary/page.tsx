import { Suspense } from "react";
import DemoItineraryClient from "./DemoClient";

// SSGを止めて常に動的に（CSRバイアウト時のビルド安定化）
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm opacity-70">Loading itinerary…</div>}>
      <DemoItineraryClient />
    </Suspense>
  );
}
