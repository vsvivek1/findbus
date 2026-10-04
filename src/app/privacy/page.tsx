import { permanentRedirect } from "next/navigation";

// The policy lives on calecutech.com with the other Calecute app policies.
export default function PrivacyPage() {
  permanentRedirect("https://calecutech.com/findmybus/privacy");
}
