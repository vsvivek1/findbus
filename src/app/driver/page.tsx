import type { Metadata } from "next";
import DriverClient from "./DriverClient";

export const metadata: Metadata = { title: "Driver · Findbus", robots: { index: false } };

export default async function DriverPage({ searchParams }: PageProps<"/driver">) {
  const { key } = await searchParams;
  return <DriverClient driverKey={typeof key === "string" ? key : null} />;
}
