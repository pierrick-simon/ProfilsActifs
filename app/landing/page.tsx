import { headers } from "next/headers";
import LandingHero from "@/components/landing-hero";

export default async function LandingPage() {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";

  return (
    <main className="flex flex-1">
      <LandingHero host={host} />
    </main>
  );
}
