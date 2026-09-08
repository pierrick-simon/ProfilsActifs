import MessagesContacts from "@/components/messages-contacts";

export default function MessagesPage() {
  return (
    <>
      <div className="flex min-h-0 flex-1 lg:hidden">
        <MessagesContacts variant="page" />
      </div>
      <div className="hidden flex-1 items-center justify-center lg:flex">
        <p className="font-sans text-sm text-texte-tertiaire">
          Sélectionnez une conversation.
        </p>
      </div>
    </>
  );
}
