import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";

const riderSteps = [
  ["Search your stop", "Type where you are and where you're going."],
  ["See it on the map", "Buses on that route show up live, with how long ago they were seen."],
  ["Leave on time", "No more waiting at the stop wondering if the bus already left."],
];

const ownerSteps = [
  ["Register free", "Add your buses, their routes and stops in two minutes."],
  ["Send the driver a link", "The driver opens it on their phone and taps Start. No app to install."],
  ["Fill more seats", "Riders who can see your bus coming choose your bus."],
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-amber-100 to-transparent">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              Live bus tracking
            </p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight md:text-5xl">
              Where is my bus? Now you know.
            </h1>
            <p className="mt-4 text-lg text-stone-700">
              Findbus shows private and city buses live on a map. Bus owners share their location
              for free from the driver&apos;s phone, and riders stop guessing at the bus stop.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/find" className="btn">Find my bus</Link>
              <Link href="/owner" className="btn-secondary">Put my buses on the map</Link>
            </div>
          </div>
          <div id="join">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-2">
        {[
          ["For riders", riderSteps, "/find", "Try it now"],
          ["For bus owners", ownerSteps, "/owner", "Register your buses"],
        ].map(([title, steps, href, cta]) => (
          <div key={title as string} className="card">
            <h2 className="text-xl font-bold">{title as string}</h2>
            <ol className="mt-4 space-y-4">
              {(steps as string[][]).map(([h, p], i) => (
                <li key={h} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{h}</p>
                    <p className="text-stone-600">{p}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href={href as string} className="btn-secondary mt-5">{cta as string}</Link>
          </div>
        ))}
      </section>
    </div>
  );
}
