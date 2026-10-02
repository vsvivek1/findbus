import type { Metadata } from "next";
import OwnerRegister from "./OwnerRegister";

export const metadata: Metadata = { title: "For bus owners · Findbus" };

export default function OwnerPage() {
  return <OwnerRegister />;
}
