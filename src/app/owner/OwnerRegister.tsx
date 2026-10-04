"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { saveOwnerKey, useSavedOwnerKey } from "@/lib/storage";

export default function OwnerRegister() {
  const router = useRouter();
  const savedKey = useSavedOwnerKey();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      const key = await rpc<string>("fb_register_owner", {
        p_name: f.get("name"),
        p_phone: f.get("phone"),
        p_company: f.get("company") || null,
        p_email: f.get("email") || null,
        p_city: f.get("city") || null,
      });
      saveOwnerKey(key);
      router.push(`/owner/dashboard?key=${key}&new=1`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-extrabold">Put your buses on the map</h1>
        <p className="mt-3 text-lg text-stone-700">
          Riders choose the bus they can see coming. Findbus is free for owners: register, add your
          buses, and send each driver a link. The driver opens it on their phone and taps Start.
        </p>
        <ul className="mt-6 space-y-2 text-stone-700">
          <li>✅ No app or GPS device to buy</li>
          <li>✅ Works on any smartphone browser</li>
          <li>✅ Pause a bus any time from your dashboard</li>
        </ul>
        {savedKey && (
          <a href={`/owner/dashboard?key=${savedKey}`} className="btn-secondary mt-6">
            Open my dashboard
          </a>
        )}
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        <h2 className="text-xl font-bold">Register as an owner</h2>
        <div>
          <label className="label" htmlFor="o-name">Your name</label>
          <input id="o-name" name="name" required maxLength={120} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="o-company">Bus company or brand (optional)</label>
          <input id="o-company" name="company" maxLength={120} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="o-phone">Phone</label>
            <input id="o-phone" name="phone" type="tel" required minLength={5} maxLength={30} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="o-email">Email (optional)</label>
            <input id="o-email" name="email" type="email" maxLength={200} className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="o-city">Town or city</label>
          <input id="o-city" name="city" maxLength={120} className="input" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={saving}>
          {saving ? "Creating your dashboard…" : "Create my free dashboard"}
        </button>
      </form>
    </div>
  );
}
