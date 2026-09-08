import MessagesContacts from "@/components/messages-contacts";
import RequireRegistration from "@/components/require-registration";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRegistration>
      <div className="flex min-h-0 flex-1 bg-fond-neutre">
        <aside className="hidden w-80 shrink-0 border-r border-bordure-defaut bg-fond-page lg:flex lg:flex-col">
          <MessagesContacts variant="sidebar" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </RequireRegistration>
  );
}
