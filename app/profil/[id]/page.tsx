import ProfileDetail from "@/components/profile-detail";
import RequireRegistration from "@/components/require-registration";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RequireRegistration>
      <ProfileDetail userId={id} />
    </RequireRegistration>
  );
}
