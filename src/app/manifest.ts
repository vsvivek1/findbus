import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Findbus · Where is my bus?",
    short_name: "Findbus",
    description: "See buses live on a map. Bus owners share their location from the driver's phone.",
    start_url: "/find",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf7",
    theme_color: "#f59e0b",
    categories: ["travel", "navigation"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Find a bus", url: "/find" },
      { name: "My buses", url: "/owner/dashboard" },
    ],
  };
}
