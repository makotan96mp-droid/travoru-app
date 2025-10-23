export default function Home() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Travoru (dev)</h1>
      <p className="mb-6 text-neutral-600">Use the button below to create a dummy plan.</p>
      <a className="btn" href="/new">Create a new itinerary</a>
    </div>
  );
}
