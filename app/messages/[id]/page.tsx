import ChatConversation from "@/components/chat-conversation";
import RequireRegistration from "@/components/require-registration";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { id } = await params;
  const { name } = await searchParams;

  return (
    <RequireRegistration>
      <ChatConversation contactId={id} contactName={name} />
    </RequireRegistration>
  );
}
