import ProfileGrid from "@/components/profile-grid";
import RequireRegistration from "@/components/require-registration";
import AccountMenu from "@/components/account-menu";

export default function Home() {
  return (
    <RequireRegistration>
      <ProfileGrid />
      <AccountMenu />
    </RequireRegistration>
  );
}
