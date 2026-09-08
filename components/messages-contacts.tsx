"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "@/components/icons";
import { useToast } from "@/components/toast";
import BackButton from "@/components/back-button";

type Contact = {
  id: string;
  name: string | null;
  image: string | null;
  last_message_at: string | null;
};

function formatLastMessage(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function MessagesContacts({
  variant = "page",
}: {
  variant?: "page" | "sidebar";
}) {
  const { showError } = useToast();
  const pathname = usePathname();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/messages/contacts");
        if (!response.ok) {
          throw new Error("contacts unavailable");
        }
        const data = await response.json();
        if (active) {
          setContacts(Array.isArray(data.contacts) ? data.contacts : []);
        }
      } catch {
        if (active) {
          showError("Impossible de charger vos contacts.", "Messages indisponibles");
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
  }, [showError]);

  const isSidebar = variant === "sidebar";

  return (
    <main
      className={
        isSidebar
          ? "flex min-h-0 flex-1 flex-col bg-fond-page"
          : "flex min-h-0 flex-1 justify-center bg-fond-page"
      }
    >
      <div
        className={
          isSidebar
            ? "flex min-h-0 w-full flex-1 flex-col"
            : "flex w-full flex-1 flex-col overflow-hidden bg-fond-page"
        }
      >
        <header className="flex items-center gap-3.5 border-b border-bordure-defaut px-4 py-3">
          {!isSidebar && (
            <BackButton href="/" label="Retour" />
          )}
          <span className="font-sans text-lg font-medium leading-tight text-texte-principal">
            Messages
          </span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {loading ? (
            <p className="px-5 py-8 text-center font-sans text-sm text-texte-tertiaire">
              Chargement de vos contacts...
            </p>
          ) : contacts.length === 0 ? (
            <p className="px-5 py-8 text-center font-sans text-sm text-texte-tertiaire">
              Aucune conversation pour le moment.
            </p>
          ) : (
            contacts.map((contact) => {
              const name = contact.name || "Utilisateur";
              const initial = name.charAt(0).toUpperCase();
              const active = pathname === `/messages/${contact.id}`;
              return (
                <Link
                  key={contact.id}
                  href={`/messages/${contact.id}?name=${encodeURIComponent(name)}`}
                  className={`flex items-center gap-3 border-b border-bordure-defaut px-4 py-3 transition-colors last:border-b-0 hover:bg-fond-neutre ${
                    active ? "bg-fond-neutre" : ""
                  }`}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fond-bleu-clair font-sans text-sm font-medium text-bleu-institutionnel">
                    {contact.image ? (
                      <Image
                        src={contact.image}
                        alt=""
                        width={44}
                        height={44}
                        className="size-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-sans text-sm font-medium text-texte-principal">
                      {name}
                    </span>
                    <span className="truncate font-sans text-xs text-texte-tertiaire">
                      ProfilsActifs
                    </span>
                  </div>
                  <span className="shrink-0 font-sans text-xs text-texte-tertiaire">
                    {formatLastMessage(contact.last_message_at)}
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-texte-tertiaire" />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
