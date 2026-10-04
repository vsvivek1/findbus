import type { CapacitorConfig } from "@capacitor/cli";

// The Android app is a native shell around the live site, so web changes ship
// without a Play Store update. The native part adds background GPS for drivers.
const config: CapacitorConfig = {
  appId: "com.calecutech.findmybus",
  appName: "Findbus",
  webDir: "android-shell",
  server: {
    url: "https://findbus-azure.vercel.app/find",
    errorPath: "index.html",
  },
  android: {
    allowMixedContent: false,
    // Keeps background location updates flowing past 5 minutes.
    useLegacyBridge: true,
  },
  plugins: {
    // Sends fetch() through native HTTP so location updates aren't throttled
    // while the app is in the background.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
