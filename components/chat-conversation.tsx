"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  PlusIcon,
} from "@/components/icons";

type Message = {
  id: number;
  author: "contact" | "moi";
  text: string;
};

const initialMessages: Message[] = [
  { id: 1, author: "contact", text: "Bonjour ! Comment puis-je vous aider aujourd'hui ?" },
  { id: 2, author: "moi", text: "Bonjour, j'ai une question à propos de l'offre." },
  { id: 3, author: "contact", text: "Bien sûr, je vous écoute." },
];

export default function ChatConversation() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    setMessages((current) => [
      ...current,
      { id: current.length + 1, author: "moi", text },
    ]);
    setDraft("");
  }

  return (
    <main className="flex flex-1 justify-center bg-fond-page md:bg-fond-neutre md:p-4 lg:p-6">
      <div className="flex w-full flex-col overflow-hidden bg-fond-page md:max-w-2xl md:rounded-2xl md:border md:border-bordure-defaut md:shadow-sm">
        <header className="flex items-center gap-3.5 border-b border-bordure-defaut px-4 py-3">
          <button
            type="button"
            aria-label="Retour au fil"
            onClick={() => router.push("/")}
            className="flex size-9 items-center justify-center rounded-lg text-bleu-institutionnel transition-colors hover:bg-fond-neutre"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <div className="flex flex-1 flex-col">
            <span className="font-sans text-lg font-medium leading-tight text-texte-principal">
              Camille Rousseau
            </span>
            <span className="font-sans text-sm text-texte-tertiaire">
              Recruteuse · ProfilsActifs
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
          {messages.map((message) =>
            message.author === "contact" ? (
              <p
                key={message.id}
                className="max-w-[85%] self-start px-1 font-sans text-base leading-snug text-texte-principal"
              >
                {message.text}
              </p>
            ) : (
              <p
                key={message.id}
                className="max-w-[85%] self-end rounded-[14px_14px_8px_14px] bg-fond-neutre px-3.5 py-2.5 font-sans text-base leading-snug text-texte-principal"
              >
                {message.text}
              </p>
            ),
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
                  disabled={!draft.trim()}
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
