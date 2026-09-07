import MessagesContacts from "@/components/messages-contacts";
import RequireRegistration from "@/components/require-registration";

export default function MessagesPage() {
  return (
    <RequireRegistration>
      <MessagesContacts />
    </RequireRegistration>
  );
}
