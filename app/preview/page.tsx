import ItineraryPreview from "../(planner)/itinerary-preview";
export default function Page(){
  const payload = {
    city: "大阪",
    startDate: "2025-11-06",
    endDate: "2025-11-10",
    purposes: ["観光","グルメ","宿泊"],
    hotelName: "ホテルモントレ大阪",
    mustSee: ["USJ","通天閣","大阪城","海遊館"]
  };
  // デモ用：同階層に itnerary-preview.tsx が無い場合は PlanDayCard を直接並べる簡易実装でもOK
  // 既存の画面に組み込む場合は、このページは不要です
  return <div className="p-6">
    <h1 className="text-xl font-semibold mb-4">Itinerary (2-main-slots UI)</h1>
    {/* 既存のコンポーネントに差し替えてね */}
  </div>;
}
