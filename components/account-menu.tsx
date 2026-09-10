"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth_client";
import { useViewerRole } from "@/hooks/use-role";
import {
  BriefcaseIcon,
  CheckIcon,
  ChevronRightIcon,
  HeartIcon,
  InfoIcon,
  MailIcon,
} from "@/components/icons";

export default function AccountMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { isRecruiter, isAdmin, isCandidate } = useViewerRole();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsQuestionnaire, setNeedsQuestionnaire] = useState(false);

  useEffect(() => {
    if (!session || !isCandidate) {
      setNeedsQuestionnaire(false);
      return;
    }

    let alive = true;
    async function load() {
      try {
        const response = await fetch(`/api/user/${session.user.id}`);
        if (!response.ok) {
          if (alive) {
            setNeedsQuestionnaire(true);
          }
          return;
        }
        const data = await response.json();
        if (alive) {
          setNeedsQuestionnaire(!data.certification_date);
        }
      } catch {
        if (alive) {
          setNeedsQuestionnaire(true);
        }
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [session, isCandidate]);

  const onAuthPage =
    pathname.startsWith("/inscription") ||
    pathname.startsWith("/connexion") ||
    pathname.startsWith("/landing");

  if (!session || onAuthPage) {
    return null;
  }

  const name = session.user.name || "Utilisateur";
  const image = session.user.image ?? null;
  const initial = name.charAt(0).toUpperCase();
  const canBrowse = isRecruiter || isAdmin;

  async function handleSignOut() {
    setLoading(true);
    await authClient.signOut();
    router.push("/connexion");
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-0 cursor-default"
          />
          <div className="absolute bottom-full left-0 z-10 mb-2 w-52 overflow-hidden rounded-xl border border-bordure-defaut bg-fond-page p-1 shadow-[0px_16px_32px_-12px_rgba(14,18,27,0.1)]">
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-sans text-sm font-medium text-texte-principal transition-colors hover:bg-fond-neutre"
            >
              <MailIcon className="size-4 text-texte-tertiaire" />
              Messages
            </Link>
            {isCandidate && (
              <Link
                href="/inscription/profil"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-sans text-sm font-medium text-texte-principal transition-colors hover:bg-fond-neutre"
              >
                <BriefcaseIcon className="size-4 text-texte-tertiaire" />
                Secteur et compétences
              </Link>
            )}
            {needsQuestionnaire && (
              <Link
                href="/inscription/questions"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-sans text-sm font-medium text-texte-principal transition-colors hover:bg-fond-neutre"
              >
                <InfoIcon className="size-4 text-texte-tertiaire" />
                Questionnaire
              </Link>
            )}
            {canBrowse && (
              <Link
                href="/favoris"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-sans text-sm font-medium text-texte-principal transition-colors hover:bg-fond-neutre"
              >
                <HeartIcon className="size-4 text-texte-tertiaire" />
                Favoris
              </Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left font-sans text-sm font-medium text-action-sur-blanc transition-colors hover:bg-fond-neutre disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative z-10 flex max-w-[200px] items-center gap-2 rounded-full border border-bordure-defaut bg-fond-page py-1.5 pl-1.5 pr-2.5 text-left shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)] transition-colors hover:bg-fond-neutre"
      >
        <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fond-bleu-clair font-sans text-xs font-medium text-bleu-institutionnel">
          {image ? (
            <Image
              src={image}
              alt=""
              width={32}
              height={32}
              className="size-full object-cover"
            />
          ) : (
            initial
          )}
        </span>
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate font-sans text-sm font-medium text-texte-principal">
            {name}
          </span>
          <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-bleu-institutionnel text-texte-inverse">
            <CheckIcon className="size-2" />
          </span>
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-texte-tertiaire" />
      </button>
    </div>
  );
}
