"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isNativeApp, openAppSettings, startTracking, type Tracker } from "@/lib/native";
import { rpc } from "@/lib/supabase";
import { timeAgo } from "@/lib/types";

type DriverBus = { reg_no: string; name: string | null; route_name: string; stops: string[]; active: boolean };

// Send at most one update per interval, even if the phone reports more often.
const SEND_EVERY_MS = 10_000;

const APP_HOST = "findbus-azure.vercel.app";

const noopSubscribe = () => () => {};

export default function DriverClient({ driverKey: key }: { driverKey: string | null }) {
  const [bus, setBus] = useState<DriverBus | null>(null);
  const [error, setError] = useState<string | null>(
    key ? null : "This page needs the driver link from the bus owner.",
  );
  const [sharing, setSharing] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [, tick] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const tracker = useRef<Tracker | null>(null);
  const native = useSyncExternalStore(noopSubscribe, isNativeApp, () => false);
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
      tracker.current?.stop();
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

  async function start() {
    if (!key) return;
    setError(null);
    setPermissionDenied(false);
    setSharing(true);
    // The app keeps tracking with the screen off; a browser needs it on.
    if (!native) keepScreenOn();
    lastSentAt.current = 0;
    try {
      tracker.current = await startTracking(
        async (fix) => {
          const now = Date.now();
          if (now - lastSentAt.current < SEND_EVERY_MS) return;
          lastSentAt.current = now;
          try {
            await rpc("fb_update_location", {
              p_driver_secret: key,
              p_lat: fix.lat,
              p_lng: fix.lng,
              p_speed: fix.speedKmh,
              p_heading: fix.heading,
            });
            setLastSent(new Date().toISOString());
            setError(null);
          } catch (err) {
            setError((err as Error).message);
          }
        },
        (message, denied) => {
          setPermissionDenied(denied);
          setError(
            denied
              ? native
                ? "Location permission is off. Allow location for Findbus, then tap Start again."
                : "Location permission is off. Allow location for this site in your browser settings, then tap Start again."
              : `Couldn't get location: ${message}`,
          );
          stop();
        },
      );
    } catch (err) {
      setError((err as Error).message);
      stop();
    }
  }

  function stop() {
    tracker.current?.stop();
    tracker.current = null;
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
            {!sharing
              ? "Tap Start when the trip begins."
              : native
                ? "Sharing location. You can lock the phone or use other apps."
                : "Sharing location. Keep this page open and the screen on."}
          </p>
          {lastSent && <p className="text-sm text-stone-500">Last sent {timeAgo(lastSent)}</p>}
        </div>
      )}
      {error && (
        <div className="card mt-4 border-red-200 text-red-700">
          {error}
          {permissionDenied && native && (
            <button type="button" className="btn-secondary mt-3 w-full" onClick={openAppSettings}>
              Open settings
            </button>
          )}
        </div>
      )}
      {bus && !native && key && (
        <p className="mt-4 text-center text-sm text-stone-600">
          On Android?{" "}
          <a
            className="font-semibold text-amber-700 underline"
            href={`intent://${APP_HOST}/driver?key=${key}#Intent;scheme=https;package=app.findbus.android;end`}
          >
            Open in the Findbus app
          </a>{" "}
          to keep sharing with the screen off.
        </p>
      )}
    </div>
  );
}
