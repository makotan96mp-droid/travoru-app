import React from "react";
import PlanDayCard from "../_components/PlanDayCard";

export default function ItineraryPreview() {
  const sample = [
    { time: "09:00", title: "集合 / 出発" },
    { time: "10:30", title: "観光スポット A" },
    { time: "12:00", title: "ランチ" },
  ];
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Itinerary Preview</h1>
      <PlanDayCard dayKey="day1" items={sample} />
    </main>
  );
}
