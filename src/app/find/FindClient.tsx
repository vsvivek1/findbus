"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { rpc } from "@/lib/supabase";
import { isLive, timeAgo, type BusResult } from "@/lib/types";

const BusMap = dynamic(() => import("@/components/BusMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-stone-500">Loading map…</div>,
});

const REFRESH_MS = 10_000;

export default function FindClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState({ q: "", from: "", to: "" });
  const [buses, setBuses] = useState<BusResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      rpc<BusResult[]>("fb_search", { p_q: query.q, p_from: query.from, p_to: query.to })
        .then((data) => {
          if (!alive) return;
          setBuses(data);
          setError(null);
        })
        .catch((err) => alive && setError((err as Error).message));
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [query]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSelectedId(null);
    setQuery({ q: q.trim(), from: from.trim(), to: to.trim() });
  }

  const liveCount = buses?.filter((b) => isLive(b.location_updated_at)).length ?? 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 lg:h-[calc(100vh-8rem)] lg:flex-row">
      <div className="flex flex-col gap-4 lg:w-96 lg:shrink-0">
        <form onSubmit={onSubmit} className="card space-y-3">
          <h1 className="text-xl font-bold">Find your bus</h1>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="From stop" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input className="input" placeholder="To stop" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <input
            className="input"
            placeholder="Or search bus name, number or route"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn w-full">Search</button>
        </form>

        <div className="card flex-1 overflow-auto p-0">
          <div className="sticky top-0 border-b border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
            {buses == null
              ? "Loading buses…"
              : `${buses.length} bus${buses.length === 1 ? "" : "es"} · ${liveCount} live now`}
          </div>
          {error && <p className="p-4 text-sm text-red-600">{error}</p>}
          {buses?.length === 0 && (
            <p className="p-4 text-stone-600">
              No buses match yet. Owners are still joining, so{" "}
              <Link href="/#join" className="font-semibold text-amber-700 underline">
                join the waitlist
              </Link>{" "}
              and we&apos;ll tell you when your route goes live.
            </p>
          )}
          <ul>
            {buses?.map((b) => {
              const live = isLive(b.location_updated_at);
              return (
                <li key={b.id}>
                  <button
                    onClick={() => setSelectedId(b.id)}
                    className={`w-full border-b border-stone-100 px-4 py-3 text-left hover:bg-amber-50 ${
                      selectedId === b.id ? "bg-amber-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${live ? "bg-green-500" : "bg-stone-300"}`} />
                      <span className="font-semibold">{b.name || b.reg_no}</span>
                      {b.is_demo && (
                        <span className="rounded bg-stone-100 px-1.5 text-xs text-stone-500">Demo</span>
                      )}
                      <span className="ml-auto text-xs text-stone-500">
                        {b.location_updated_at ? (live ? "Live" : `Seen ${timeAgo(b.location_updated_at)}`) : "Not tracking"}
                      </span>
                    </div>
                    <p className="text-sm text-stone-700">{b.route_name}</p>
                    <p className="text-xs text-stone-500">
                      {b.reg_no} · {b.operator}
                    </p>
                    {b.stops.length > 0 && (
                      <p className="mt-1 text-xs text-stone-500">{b.stops.join(" → ")}</p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="h-[60vh] overflow-hidden rounded-2xl border border-stone-200 lg:h-auto lg:flex-1">
        <BusMap buses={buses ?? []} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </div>
  );
}
