"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/native";

/**
 * In the Android app, a tapped Findbus link (for example a driver link sent on
 * WhatsApp) opens the app; this sends the app to that page.
 */
export default function NativeLinks() {
  useEffect(() => {
    if (!isNativeApp()) return;
    let remove: (() => void) | undefined;
    const go = (url: string | undefined) => {
      if (!url) return;
      const target = new URL(url);
      if (target.host !== window.location.host) return;
      if (target.pathname + target.search !== window.location.pathname + window.location.search) {
        window.location.href = target.pathname + target.search;
      }
    };
    import("@capacitor/app").then(async ({ App }) => {
      // The launch URL stays the same for the whole app session, so only
      // follow it once, not on every page load.
      const launch = await App.getLaunchUrl();
      try {
        if (launch?.url && sessionStorage.getItem("fb_launch_url") !== launch.url) {
          sessionStorage.setItem("fb_launch_url", launch.url);
          go(launch.url);
        }
      } catch {
        go(launch?.url);
      }
      const handle = await App.addListener("appUrlOpen", (e) => go(e.url));
      remove = () => void handle.remove();
    });
    return () => remove?.();
  }, []);
  return null;
}
