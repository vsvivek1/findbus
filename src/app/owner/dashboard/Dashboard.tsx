"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { rpc } from "@/lib/supabase";
import { saveOwnerKey, useOrigin, useSavedOwnerKey } from "@/lib/storage";
import { isLive, timeAgo, type OwnerDashboard } from "@/lib/types";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary text-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this link", text);
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export default function Dashboard({ urlKey, isNew }: { urlKey: string | null; isNew: boolean }) {
  const savedKey = useSavedOwnerKey();
  const key = urlKey || savedKey;
  const origin = useOrigin();
  const [data, setData] = useState<OwnerDashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Bumped after each change so the effect below reloads straight away.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (urlKey) saveOwnerKey(urlKey);
  }, [urlKey]);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    const load = () =>
      rpc<OwnerDashboard>("fb_owner_dashboard", { p_secret: key })
        .then((d) => {
          if (!alive) return;
          setData(d);
          setLoadError(null);
        })
        .catch((err) => alive && setLoadError((err as Error).message));
    load();
    const t = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [key, version]);

  const error = key
    ? loadError
    : origin && "Open the dashboard link you saved when you registered, or register again.";

  async function addBus(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setAdding(true);
    try {
      await rpc("fb_add_bus", {
        p_secret: key,
        p_reg_no: f.get("reg_no"),
        p_route_name: f.get("route_name"),
        p_name: f.get("name") || null,
        p_stops: String(f.get("stops") || "")
          .split(/\n|,/)
          .map((s) => s.trim())
          .filter(Boolean),
      });
      form.reset();
      reload();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function setActive(busId: string, active: boolean) {
    await rpc("fb_set_bus_active", { p_secret: key, p_bus_id: busId, p_active: active });
    reload();
  }

  async function remove(busId: string, label: string) {
    if (!confirm(`Remove ${label}? Its driver link will stop working.`)) return;
    await rpc("fb_delete_bus", { p_secret: key, p_bus_id: busId });
    reload();
  }

  const dashboardLink = key ? `${origin}/owner/dashboard?key=${key}` : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {error && (
        <div className="card border-red-200 text-red-700">
          {error}{" "}
          <Link href="/owner" className="font-semibold underline">Register</Link>
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <h1 className="text-2xl font-extrabold">{data.owner.company || data.owner.name}</h1>
              <p className="text-stone-600">
                {data.buses.length} bus{data.buses.length === 1 ? "" : "es"} ·{" "}
                {data.buses.filter((b) => isLive(b.location_updated_at)).length} live now
              </p>
            </div>
            <div className="ml-auto">
              <CopyButton text={dashboardLink} label="Copy my dashboard link" />
            </div>
          </div>

          {isNew && (
            <div className="card border-amber-300 bg-amber-50">
              <p className="font-semibold">Save your dashboard link.</p>
              <p className="text-sm text-stone-700">
                It&apos;s your login. Anyone with it can manage your buses, so keep it private. This
                browser remembers it too.
              </p>
            </div>
          )}

          <form onSubmit={addBus} className="card space-y-4">
            <h2 className="text-lg font-bold">Add a bus</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="b-reg">Registration no.</label>
                <input id="b-reg" name="reg_no" required maxLength={20} placeholder="KL-11-AB-1234" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="b-name">Bus name (optional)</label>
                <input id="b-name" name="name" maxLength={80} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="b-route">Route</label>
                <input id="b-route" name="route_name" required maxLength={120} placeholder="Kozhikode - Kannur" className="input" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="b-stops">Stops in order, one per line or comma separated</label>
              <textarea id="b-stops" name="stops" rows={3} className="input" placeholder="Kozhikode, Koyilandy, Vadakara, Kannur" />
            </div>
            <button className="btn" disabled={adding}>{adding ? "Adding…" : "Add bus"}</button>
          </form>

          <div className="space-y-3">
            {data.buses.length === 0 && (
              <p className="text-stone-600">No buses yet. Add your first one above.</p>
            )}
            {data.buses.map((b) => {
              const live = isLive(b.location_updated_at);
              const driverLink = `${origin}/driver?key=${b.driver_secret}`;
              const label = b.name || b.reg_no;
              return (
                <div key={b.id} className={`card ${b.active ? "" : "opacity-60"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${live ? "bg-green-500" : "bg-stone-300"}`} />
                    <span className="font-bold">{label}</span>
                    <span className="text-sm text-stone-500">{b.reg_no}</span>
                    <span className="ml-auto text-sm text-stone-500">
                      {!b.active ? "Paused" : live ? "Live now" : b.location_updated_at ? `Last seen ${timeAgo(b.location_updated_at)}` : "Driver hasn't started yet"}
                    </span>
                  </div>
                  <p className="mt-1 text-stone-700">{b.route_name}</p>
                  {b.stops.length > 0 && <p className="text-sm text-stone-500">{b.stops.join(" → ")}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <CopyButton text={driverLink} label="Copy driver link" />
                    <a
                      className="btn-secondary text-sm"
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Open this on your phone and tap Start to share ${label}'s location on Findbus: ${driverLink}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Send on WhatsApp
                    </a>
                    <button className="btn-secondary text-sm" onClick={() => setActive(b.id, !b.active)}>
                      {b.active ? "Pause" : "Resume"}
                    </button>
                    <button className="btn-secondary text-sm text-red-600" onClick={() => remove(b.id, label)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
