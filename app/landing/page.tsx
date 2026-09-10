import { headers } from "next/headers";
import LandingHero from "@/components/landing-hero";

export default async function LandingPage() {
  const headerList = await headers();

  return (
    <main className="flex flex-1">
      <LandingHero/>
    </main>
  );
}
