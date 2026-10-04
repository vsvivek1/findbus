import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import InstallApp from "@/components/InstallApp";
import NativeLinks from "@/components/NativeLinks";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Findbus · Where is my bus?",
  description:
    "See private and city buses live on a map. Bus owners share their buses' location for free, riders stop guessing at the bus stop.",
  appleWebApp: { capable: true, title: "Findbus", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <NativeLinks />
        <header className="sticky top-0 z-[1000] border-b border-stone-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span aria-hidden>🚌</span> Findbus
            </Link>
            <div className="ml-auto flex items-center gap-1 text-sm sm:gap-3">
              <Link href="/find" className="rounded-md px-2 py-1 hover:bg-stone-100">
                Find a bus
              </Link>
              <Link href="/owner" className="rounded-md px-2 py-1 hover:bg-stone-100">
                For owners
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
          <InstallApp className="mb-4" />
          Findbus · Live bus locations shared by bus owners ·{" "}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
        </footer>
      </body>
    </html>
  );
}
