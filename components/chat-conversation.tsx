"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  PlusIcon,
} from "@/components/icons";
import { useToast } from "@/components/toast";

type ChatMessage = {
  id: string;
  content: string;
  isMine: boolean;
};

type ApiMessage = {
  id: string;
  content: string;
  is_mine: boolean;
};

type ApiContact = {
  id: string;
  name: string | null;
  image: string | null;
};

export default function ChatConversation({
  contactId,
  contactName,
}: {
  contactId: string;
  contactName?: string;
}) {
  const router = useRouter();
  const { showError } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState(contactName ?? "Conversation");
  const [image, setImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/messages/${contactId}?limit=30`);
        if (!response.ok) {
          throw new Error("conversation unavailable");
        }
        const data = await response.json();
        const list: ChatMessage[] = (
          Array.isArray(data.messages) ? (data.messages as ApiMessage[]) : []
        )
          .map((m) => ({ id: m.id, content: m.content, isMine: m.is_mine }))
          .reverse();
        if (active) {
          setMessages(list);
        }
      } catch {
        if (active) {
          showError("Impossible de charger la conversation.", "Messages indisponibles");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [contactId, showError]);

  useEffect(() => {
    let active = true;
    async function loadContact() {
      try {
        const response = await fetch("/api/messages/contacts");
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const contacts: ApiContact[] = Array.isArray(data.contacts)
          ? data.contacts
          : [];
        const match = contacts.find((c) => c.id === contactId);
        if (active && match) {
          if (match.name) {
            setName(match.name);
          }
          setImage(match.image ?? null);
        }
      } catch {
      }
    }
    loadContact();
    return () => {
      active = false;
    };
  }, [contactId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) {
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${contactId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!response.ok) {
        throw new Error("send failed");
      }
      const created: ApiMessage = await response.json();
      setMessages((current) => [
        ...current,
        { id: created.id, content: created.content, isMine: true },
      ]);
      setDraft("");
    } catch {
      showError("Votre message n'a pas pu être envoyé.", "Envoi échoué");
    } finally {
      setSending(false);
    }
  }

  const initial = name.charAt(0).toUpperCase();

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-fond-page">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-fond-page">
        <header className="flex items-center gap-3.5 border-b border-bordure-defaut px-4 py-3">
          <button
            type="button"
            aria-label="Retour aux messages"
            onClick={() => router.push("/messages")}
            className="flex size-9 items-center justify-center rounded-lg text-bleu-institutionnel transition-colors hover:bg-fond-neutre lg:hidden"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fond-bleu-clair font-sans text-sm font-medium text-bleu-institutionnel">
            {image ? (
              <Image
                src={image}
                alt=""
                width={36}
                height={36}
                className="size-full object-cover"
              />
            ) : (
              initial
            )}
          </span>
          <div className="flex flex-1 flex-col">
            <span className="font-sans text-lg font-medium leading-tight text-texte-principal">
              {name}
            </span>
            <span className="font-sans text-sm text-texte-tertiaire">
              ProfilsActifs
            </span>
          </div>
          <button
            type="button"
            aria-label="Options de la conversation"
            className="flex size-9 items-center justify-center rounded-lg text-texte-tertiaire transition-colors hover:bg-fond-neutre"
          >
            <ChevronDownIcon className="size-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-end gap-5 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="self-center font-sans text-sm text-texte-tertiaire">
              Chargement de la conversation...
            </p>
          ) : messages.length === 0 ? (
            <p className="self-center font-sans text-sm text-texte-tertiaire">
              Aucun message. Écrivez le premier !
            </p>
          ) : (
            messages.map((message) =>
              message.isMine ? (
                <p
                  key={message.id}
                  className="max-w-[85%] self-end rounded-[14px_14px_8px_14px] bg-fond-neutre px-3.5 py-2.5 font-sans text-base leading-snug text-texte-principal"
                >
                  {message.content}
                </p>
              ) : (
                <p
                  key={message.id}
                  className="max-w-[85%] self-start px-1 font-sans text-base leading-snug text-texte-principal"
                >
                  {message.content}
                </p>
              ),
            )
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="px-4 pb-4 pt-2">
          <div className="rounded-[18px] bg-fond-bleu-clair p-px pt-2.5">
            <div className="flex flex-col gap-2 rounded-[17px] bg-fond-page p-2.5">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Écrivez votre message..."
                aria-label="Votre message"
                className="w-full bg-transparent px-1 font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Ajouter une pièce jointe"
                  className="flex size-8 items-center justify-center rounded-lg bg-bleu-institutionnel text-texte-inverse transition-colors hover:bg-bleu-institutionnel/90"
                >
                  <PlusIcon className="size-4" />
                </button>
                <button
                  type="submit"
                  aria-label="Envoyer"
                  disabled={!draft.trim() || sending}
                  className="flex size-8 items-center justify-center rounded-lg bg-bleu-institutionnel text-texte-inverse transition-colors hover:bg-bleu-institutionnel/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-bleu-institutionnel"
                >
                  <ArrowUpIcon className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
