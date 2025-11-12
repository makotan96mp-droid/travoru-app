// app/_components/PlanDayCard.tsx
type Item = { time?: string; title: string; type?: string; meta?: any };
export default function PlanDayCard({
  dayKey = "day1",
  items = [] as Item[],
}: {
  dayKey?: string;
  items?: Item[];
}) {
  return (
    <section className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-2">
      <h3 className="font-semibold">{dayKey.toUpperCase()}</h3>
      <ul className="space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="w-16 text-white/70">{it.time ?? "--:--"}</span>
            <span>{it.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
