"use client";

import { useState } from "react";
import { rpc } from "@/lib/supabase";

type Role = "rider" | "owner";

export default function WaitlistForm({ initialRole = "rider" }: { initialRole?: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const phone = String(f.get("phone") || "").trim();
    const email = String(f.get("email") || "").trim();
    if (!phone && !email) {
      setError("Add a phone number or an email so we can reach you.");
      return;
    }
    setError(null);
    setStatus("saving");
    try {
      await rpc("fb_join_waitlist", {
        p_role: role,
        p_name: f.get("name"),
        p_phone: phone || null,
        p_email: email || null,
        p_city: f.get("city") || null,
        p_bus_count: role === "owner" && f.get("bus_count") ? Number(f.get("bus_count")) : null,
        p_note: f.get("note") || null,
      });
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="card text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 font-semibold">You&apos;re on the list.</p>
        <p className="mt-1 text-stone-600">
          {role === "owner"
            ? "We'll call you to get your buses on the map. You can also add them yourself right now."
            : "We'll tell you when buses on your route go live."}
        </p>
        <a href={role === "owner" ? "/owner" : "/find"} className="btn mt-4">
          {role === "owner" ? "Add my buses now" : "See buses live now"}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1" role="tablist">
        {(["rider", "owner"] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={role === r}
            onClick={() => setRole(r)}
            className={`rounded-md py-2 text-sm font-semibold ${
              role === r ? "bg-white shadow-sm" : "text-stone-500"
            }`}
          >
            {r === "rider" ? "I travel by bus" : "I own buses"}
          </button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="wl-name">Name</label>
        <input id="wl-name" name="name" required maxLength={120} className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="wl-phone">Phone</label>
          <input id="wl-phone" name="phone" type="tel" maxLength={30} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="wl-email">Email</label>
          <input id="wl-email" name="email" type="email" maxLength={200} className="input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="wl-city">Town or city</label>
          <input id="wl-city" name="city" maxLength={120} className="input" />
        </div>
        {role === "owner" && (
          <div>
            <label className="label" htmlFor="wl-buses">How many buses?</label>
            <input id="wl-buses" name="bus_count" type="number" min={1} max={10000} className="input" />
          </div>
        )}
      </div>
      <div>
        <label className="label" htmlFor="wl-note">
          {role === "owner" ? "Routes you run (optional)" : "Which route do you take? (optional)"}
        </label>
        <input id="wl-note" name="note" maxLength={1000} className="input" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : role === "owner" ? "Join as a bus owner" : "Join as a rider"}
      </button>
    </form>
  );
}
