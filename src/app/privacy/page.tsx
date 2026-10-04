import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy · Findbus" };

const UPDATED = "4 October 2026";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-stone-800">
      <h1 className="text-3xl font-extrabold">Privacy policy</h1>
      <p className="text-sm text-stone-500">Last updated {UPDATED}</p>

      <p>
        Findbus shows buses live on a map. This policy explains what the Findbus website and the
        Findbus Android app collect, why, and what you can do about it.
      </p>

      <h2 className="pt-2 text-xl font-bold">What we collect</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Waitlist:</strong> the name, phone number, email, town and notes you type into the
          waitlist form, so we can contact you when Findbus is available on your route.
        </li>
        <li>
          <strong>Bus owners:</strong> your name, phone number, optional company name, email and
          town, plus the buses, routes and stops you add.
        </li>
        <li>
          <strong>Drivers:</strong> while a driver has tapped Start, the phone&apos;s location
          (latitude, longitude, speed and direction) about every 10 seconds. Only the latest
          position of each bus is stored. In the Android app this continues with the screen off,
          and a notification is shown the whole time. Tracking stops when the driver taps Stop.
        </li>
        <li>
          <strong>Riders:</strong> nothing. Searching and viewing the map need no account, and your
          own location is not collected.
        </li>
      </ul>

      <h2 className="pt-2 text-xl font-bold">How it is used and shared</h2>
      <p>
        A bus&apos;s latest position, registration number, name, route, stops and operator name are
        shown publicly to riders on the map. Owner contact details, waitlist entries and driver
        links are never shown publicly. We do not sell data or use it for advertising.
      </p>
      <p>
        Data is stored with our hosting providers, Supabase (database) and Vercel (website), who
        process it only to run Findbus. Map tiles are loaded from OpenStreetMap.
      </p>

      <h2 className="pt-2 text-xl font-bold">Keeping and deleting data</h2>
      <p>
        Owners can remove a bus at any time from their dashboard, which deletes its location too.
        To delete an owner account or a waitlist entry, contact us at the developer email address on
        the Findbus Google Play listing and we will delete it within 30 days.
      </p>

      <h2 className="pt-2 text-xl font-bold">Children</h2>
      <p>Findbus is not directed at children under 13.</p>

      <h2 className="pt-2 text-xl font-bold">Changes</h2>
      <p>If this policy changes, we will update the date at the top of this page.</p>
    </article>
  );
}
