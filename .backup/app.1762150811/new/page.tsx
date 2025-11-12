"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Toast from "../_components/Toast";

type Interest = "food" | "art" | "nature" | "shopping" | "nightlife";

export default function NewPage() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  
const [loading, setLoading] = useState(false);
const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [city, setCity] = useState("tokyo");
  const [interests, setInterests] = useState<Interest[]>(["food"]);

  const toggleInterest = (value: Interest) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end || !city) {
      alert("Please fill the required fields.");
      return;
    }
    const dummyId = `demo-${Date.now()}`;
    setShowToast(true);
    setTimeout(() => {
      router.push(
        `/i/${dummyId}?city=${city}&start=${start}&end=${end}&interests=${interests.join(",")}`
      );
    }, 800);
  };

  const interestBtn = (value: Interest, label: string) => (
    <button
      type="button"
      onClick={() => toggleInterest(value)}
      className={`px-3 py-2 rounded-xl border text-sm transition ${
        interests.includes(value)
          ? "bg-brand-primary text-white border-brand-primary"
          : "bg-white text-black border-neutral-300 hover:border-brand-primary"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Create a new itinerary</h1>
      <p className="text-neutral-600 mb-6">
        Enter dates, city and interests. We’ll generate a realistic, time-aware plan.
      </p>

      <form onSubmit={onSubmit} className="space-y-6 card">
        <div>
          <label className="label">City</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="select" aria-label="行き先">
            <option value="tokyo">Tokyo</option>
            <option value="kyoto">Kyoto</option>
            <option value="osaka">Osaka</option>
            <option value="okinawa">Okinawa</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Start date</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">End date</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Interests</label>
          <div className="flex flex-wrap gap-2">
            {interestBtn("food", "Food")}
            {interestBtn("art", "Art")}
            {interestBtn("nature", "Nature")}
            {interestBtn("shopping", "Shopping")}
            {interestBtn("nightlife", "Nightlife")}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn" type="submit" disabled={loading}>{loading ? "Generating..." : "Generate (dummy)"}</button>
          <a className="inline-flex items-center text-sm underline" href="/">Cancel</a>
        </div>
      </form>

      {showToast && <Toast message="Plan created (dummy). Redirecting..." />}
    </div>
  );
}
