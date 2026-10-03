"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const noopSubscribe = () => () => {};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Registers the service worker and offers "Install app" where the browser allows it. */
export default function InstallApp({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const installed = useSyncExternalStore(noopSubscribe, isStandalone, () => true);
  const ios = useSyncExternalStore(noopSubscribe, isIos, () => false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed || (!prompt && !ios)) return null;

  return (
    <div className={className}>
      <button
        type="button"
        className="btn-secondary"
        onClick={async () => {
          if (prompt) {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(null);
          } else {
            setShowIosHint((v) => !v);
          }
        }}
      >
        📲 Install the app
      </button>
      {showIosHint && (
        <p className="mt-2 text-sm text-stone-600">
          In Safari, tap the Share button, then <strong>Add to Home Screen</strong>.
        </p>
      )}
    </div>
  );
}
