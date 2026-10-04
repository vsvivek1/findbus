export const metadata = { title: "Offline · Findbus" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-4xl">📶</p>
      <h1 className="mt-3 text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-stone-600">Findbus needs a connection to show buses live. Try again when you&apos;re back online.</p>
    </div>
  );
}
