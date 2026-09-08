import { headers } from "next/headers";
import { redirect } from "next/navigation";
import RequireRegistration from "@/components/require-registration";
import FavoritesGrid from "@/components/favorites-grid";
import { auth } from "@/lib/auth";

export default async function FavorisPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/inscription");
  }

  const role = session.user.role ?? null;
  if (role !== "recruiter" && role !== "admin") {
    redirect(`/profil/${session.user.id}`);
  }

  return (
    <RequireRegistration>
      <FavoritesGrid />
    </RequireRegistration>
  );
}
