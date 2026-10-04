import type { Metadata } from "next";
import Dashboard from "./Dashboard";

export const metadata: Metadata = { title: "My buses · Findbus", robots: { index: false } };

export default async function DashboardPage({ searchParams }: PageProps<"/owner/dashboard">) {
  const { key, new: isNew } = await searchParams;
  return <Dashboard urlKey={typeof key === "string" ? key : null} isNew={isNew != null} />;
}
