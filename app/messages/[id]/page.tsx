import ChatConversation from "@/components/chat-conversation";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { id } = await params;
  const { name } = await searchParams;

  return <ChatConversation contactId={id} contactName={name} />;
}
