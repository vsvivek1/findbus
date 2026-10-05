// Captures 1080x1920 phone screenshots of the live site for the Play listing.
// Run in CI: npx playwright install --with-deps chromium && node scripts/play-screenshots.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.SITE_URL || "https://findbus-azure.vercel.app";
const OUT = "fastlane/metadata/android/en-US/images/phoneScreenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  geolocation: { latitude: 11.2588, longitude: 75.7804 },
  permissions: ["geolocation"],
});
const page = await ctx.newPage();
const settle = (ms = 2500) => page.waitForTimeout(ms);
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

// 1. Bus list with live demo buses.
await page.goto(`${BASE}/find`, { waitUntil: "networkidle" });
await page.getByText(/live now/).waitFor({ timeout: 30000 });
await settle();
await shot("1_find");

// 2. Map with a bus selected.
await page.locator("ul button, li button").first().click().catch(() => {});
const map = page.locator(".leaflet-container").first();
await map.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, -40));
await page.waitForFunction(
  () => [...document.querySelectorAll(".leaflet-tile")].filter((t) => t.complete).length > 4,
  null,
  { timeout: 30000 },
).catch(() => {});
await settle(3000);
await shot("2_map");

// 3. Landing page.
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await settle();
await shot("3_home");

// 4. Owner sign-up.
await page.goto(`${BASE}/owner`, { waitUntil: "networkidle" });
await settle();
await shot("4_owner");

await browser.close();
console.log("saved to", OUT);
