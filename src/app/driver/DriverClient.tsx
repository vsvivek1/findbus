"use client";

import { useEffect, useRef, useState } from "react";
import { rpc } from "@/lib/supabase";
import { timeAgo } from "@/lib/types";

type DriverBus = { reg_no: string; name: string | null; route_name: string; stops: string[]; active: boolean };

// Send at most one update per interval, even if the phone reports more often.
const SEND_EVERY_MS = 10_000;

export default function DriverClient({ driverKey: key }: { driverKey: string | null }) {
  const [bus, setBus] = useState<DriverBus | null>(null);
  const [error, setError] = useState<string | null>(
    key ? null : "This page needs the driver link from the bus owner.",
  );
  const [sharing, setSharing] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [, tick] = useState(0);
  const watchId = useRef<number | null>(null);
  const lastSentAt = useRef(0);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (!key) return;
    rpc<DriverBus | null>("fb_driver_bus", { p_driver_secret: key })
      .then((b) => (b ? setBus(b) : setError("This driver link is not valid any more. Ask the owner for a new one.")))
      .catch((err) => setError((err as Error).message));
  }, [key]);

  // Re-render every few seconds so "last sent" stays fresh.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // Stop the GPS watch and screen lock when the driver leaves the page.
  useEffect(
    () => () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      wakeLock.current?.release().catch(() => {});
    },
    [],
  );

  async function keepScreenOn() {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
      wakeLock.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {
      // Not supported or denied; sharing still works while the page is open.
    }
  }

  function start() {
    if (!key) return;
    if (!("geolocation" in navigator)) {
      setError("This phone's browser can't share location.");
      return;
    }
    setError(null);
    setSharing(true);
    keepScreenOn();
    lastSentAt.current = 0;
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSentAt.current < SEND_EVERY_MS) return;
        lastSentAt.current = now;
        try {
          await rpc("fb_update_location", {
            p_driver_secret: key,
            p_lat: pos.coords.latitude,
            p_lng: pos.coords.longitude,
            p_speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
            p_heading: pos.coords.heading,
          });
          setLastSent(new Date().toISOString());
          setError(null);
        } catch (err) {
          setError((err as Error).message);
        }
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is off. Allow location for this site in your browser settings, then tap Start again."
            : `Couldn't get location: ${err.message}`,
        );
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );
  }

  function stop() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
    setSharing(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      {bus && (
        <div className="card text-center">
          <p className="text-sm text-stone-500">{bus.reg_no}</p>
          <h1 className="text-2xl font-extrabold">{bus.name || bus.reg_no}</h1>
          <p className="text-stone-700">{bus.route_name}</p>
          {!bus.active && (
            <p className="mt-3 rounded-lg bg-stone-100 p-2 text-sm">The owner has paused this bus.</p>
          )}
          <button
            onClick={sharing ? stop : start}
            disabled={!bus.active}
            className={`mt-6 h-40 w-40 rounded-full text-2xl font-extrabold shadow-lg transition disabled:opacity-40 ${
              sharing ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            {sharing ? "Stop" : "Start"}
          </button>
          <p className="mt-4 font-semibold">
            {sharing ? "Sharing location. Keep this page open." : "Tap Start when the trip begins."}
          </p>
          {lastSent && <p className="text-sm text-stone-500">Last sent {timeAgo(lastSent)}</p>}
        </div>
      )}
      {error && <p className="card mt-4 border-red-200 text-red-700">{error}</p>}
    </div>
  );
}
