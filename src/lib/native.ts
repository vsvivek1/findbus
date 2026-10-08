import { Capacitor, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";

/** True inside the Findbus Android app, false in a normal browser. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export type Fix = { lat: number; lng: number; speedKmh: number | null; heading: number | null };

export type Tracker = { stop: () => void };

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

/**
 * Watches the device position. In the Android app this keeps running with the
 * screen off (a "sharing location" notification stays visible); in a browser it
 * only runs while the page is open.
 */
export async function startTracking(
  onFix: (fix: Fix) => void,
  onError: (message: string, permissionDenied: boolean) => void,
): Promise<Tracker> {
  if (isNativeApp()) {
    // Android 13+ hides the tracking notification unless this is granted.
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.requestPermissions();
    } catch {
      // Tracking still works without the notification permission.
    }
    // Ask for location before adding the watcher: Android 14+ refuses to start
    // the location foreground service (and its notification) without it, and
    // the plugin doesn't retry once the driver allows it.
    const perms = BackgroundGeolocation as unknown as {
      requestPermissions: () => Promise<{ location: string }>;
    };
    const { location } = await perms.requestPermissions();
    if (location !== "granted") {
      onError("Location permission is off.", true);
      return { stop: () => {} };
    }
    const id = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: "Findbus is sharing this bus's location",
        backgroundMessage: "Open Findbus and tap Stop when the trip ends.",
        requestPermissions: true,
        stale: false,
        distanceFilter: 20,
      },
      (location, error) => {
        if (error) {
          const denied = error.code === "NOT_AUTHORIZED";
          onError(denied ? "Location permission is off." : error.message, denied);
          return;
        }
        if (!location) return;
        onFix({
          lat: location.latitude,
          lng: location.longitude,
          speedKmh: location.speed != null ? location.speed * 3.6 : null,
          heading: location.bearing,
        });
      },
    );
    return { stop: () => void BackgroundGeolocation.removeWatcher({ id }) };
  }

  if (!("geolocation" in navigator)) {
    onError("This phone's browser can't share location.", false);
    return { stop: () => {} };
  }
  const watchId = navigator.geolocation.watchPosition(
    (pos) =>
      onFix({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speedKmh: pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
        heading: pos.coords.heading,
      }),
    (err) => onError(err.message, err.code === err.PERMISSION_DENIED),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
  );
  return { stop: () => navigator.geolocation.clearWatch(watchId) };
}

/** Opens the app's location settings (Android app only). */
export function openAppSettings() {
  if (isNativeApp()) void BackgroundGeolocation.openSettings();
}
