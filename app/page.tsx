import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProfileGrid from "@/components/profile-grid";
import RequireRegistration from "@/components/require-registration";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/landing");
  }

  const role = session.user.role ?? null;
  if (role !== "recruiter" && role !== "admin") {
    redirect(`/profil/${session.user.id}`);
  }

  return (
    <RequireRegistration>
      <ProfileGrid />
    </RequireRegistration>
  );
}
