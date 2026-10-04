import { useSyncExternalStore } from "react";

const OWNER_KEY = "fb_owner_secret";

export function getSavedOwnerKey(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export function saveOwnerKey(key: string | null) {
  try {
    if (key) localStorage.setItem(OWNER_KEY, key);
    else localStorage.removeItem(OWNER_KEY);
  } catch {
    // Private mode or storage blocked: the dashboard link still works.
  }
}

const noopSubscribe = () => () => {};

/** Owner key saved in this browser, read without an effect. */
export function useSavedOwnerKey(): string | null {
  return useSyncExternalStore(noopSubscribe, getSavedOwnerKey, () => null);
}

/** window.location.origin on the client, "" during server render. */
export function useOrigin(): string {
  return useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
}
