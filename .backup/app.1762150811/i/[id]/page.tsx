import Link from "next/link";

type Params = { id: string };
type SearchParams = { city?: string; start?: string; end?: string; interests?: string };

const DUMMY_ITINERARY = [
  { time: "09:00", activity: "Check-in / Luggage drop" },
  { time: "10:00", activity: "Top spot #1 (indoor if rainy)" },
  { time: "12:00", activity: "Local lunch (foodie pick)" },
  { time: "14:00", activity: "Transit-optimized move to spot #2" },
  { time: "16:00", activity: "Cafe break & shopping" },
  { time: "19:00", activity: "Dinner reservation (free-cancel eligible)" },
];

// Next.js 16 / React 19: params & searchParams は Promise なので await する
export default async function ItineraryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { city = "tokyo", start = "—", end = "—", interests = "—" } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Itinerary: {id}</h1>
        <Link href="/new" className="underline text-sm">Create another</Link>
      </div>

      <div className="card">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">City:</span> {city}</div>
          <div><span className="font-medium">Dates:</span> {start} → {end}</div>
          <div className="col-span-2"><span className="font-medium">Interests:</span> {interests}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Day 1 (dummy)</h2>
        <ul className="space-y-2">
          {DUMMY_ITINERARY.map((row, i) => (
            <li key={i} className="flex gap-4">
              <div className="w-20 text-neutral-600">{row.time}</div>
              <div className="flex-1">{row.activity}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Booking links (dummy)</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          <a className="btn" href="https://www.booking.com" target="_blank">Booking</a>
          <a className="btn" href="https://www.agoda.com" target="_blank">Agoda</a>
          <a className="btn" href="https://www.trip.com" target="_blank">Trip.com</a>
          <a className="btn" href="https://travel.rakuten.co.jp" target="_blank">Rakuten</a>
        </div>
      </div>
    </div>
  );
}
