"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  UserIcon,
} from "@/components/icons";
import AuthUserBadge from "@/components/auth-user-badge";


export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [role, setRole] = useState<"candidat" | "recruteur">("candidat");

  return (
    <div className="flex h-full flex-col justify-between gap-6 overflow-y-auto p-8">
      <header className="flex items-center justify-between gap-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-bleu-institutionnel font-sans text-xs font-medium text-texte-inverse">
          PA
        </span>
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm text-texte-secondaire">
            Vous avez déjà un compte ?
          </span>
          <Link
            href="/connexion"
            className="rounded-lg bg-fond-bleu-clair px-2.5 py-1.5 font-sans text-sm font-medium text-bleu-institutionnel transition-colors hover:bg-fond-bleu-clair/70"
          >
            Se connecter
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[392px] flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <AuthUserBadge />
          <div className="text-center">
            <h1 className="font-sans text-2xl font-medium text-texte-principal">
              Créer votre compte
            </h1>
            <p className="font-sans text-base text-texte-secondaire">
              Renseignez vos informations pour commencer.
            </p>
          </div>
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(role === "candidat" ? "/inscription/questions" : "/");
          }}
        >
          <div className="flex flex-col gap-1">
            <span className="font-sans text-sm font-medium text-texte-principal">
              Je m&apos;inscris en tant que <span className="text-bleu-institutionnel">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={role === "candidat"}
                onClick={() => setRole("candidat")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-sans text-sm font-medium transition-colors ${
                  role === "candidat"
                    ? "border-bleu-institutionnel bg-fond-bleu-clair text-bleu-institutionnel"
                    : "border-bordure-defaut bg-fond-page text-texte-secondaire hover:bg-fond-neutre"
                }`}
              >
                <UserIcon className="size-4" />
                Candidat
              </button>
              <button
                type="button"
                aria-pressed={role === "recruteur"}
                onClick={() => setRole("recruteur")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-sans text-sm font-medium transition-colors ${
                  role === "recruteur"
                    ? "border-bleu-institutionnel bg-fond-bleu-clair text-bleu-institutionnel"
                    : "border-bordure-defaut bg-fond-page text-texte-secondaire hover:bg-fond-neutre"
                }`}
              >
                <BriefcaseIcon className="size-4" />
                Recruteur
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="nom" className="font-sans text-sm font-medium text-texte-principal">
              Nom complet <span className="text-bleu-institutionnel">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair">
              <UserIcon className="size-5 shrink-0 text-texte-tertiaire" />
              <input
                id="nom"
                type="text"
                placeholder="Prénom et nom"
                autoComplete="name"
                className="flex-1 bg-transparent font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="naissance" className="font-sans text-sm font-medium text-texte-principal">
              Date de naissance <span className="text-bleu-institutionnel">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair">
              <CalendarIcon className="size-5 shrink-0 text-texte-tertiaire" />
              <input
                id="naissance"
                type="date"
                autoComplete="bday"
                className="flex-1 bg-transparent font-sans text-sm text-texte-principal focus:outline-none [color-scheme:light]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="font-sans text-sm font-medium text-texte-principal">
              Adresse e-mail <span className="text-bleu-institutionnel">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair">
              <MailIcon className="size-5 shrink-0 text-texte-tertiaire" />
              <input
                id="email"
                type="email"
                placeholder="vous@exemple.fr"
                autoComplete="email"
                className="flex-1 bg-transparent font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none"
              />
            </div>
          </div>

          {role === "candidat" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="adresse" className="font-sans text-sm font-medium text-texte-principal">
                Adresse <span className="text-bleu-institutionnel">*</span>
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair">
                <MapPinIcon className="size-5 shrink-0 text-texte-tertiaire" />
                <input
                  id="adresse"
                  type="text"
                  placeholder="Numéro, rue, code postal, ville"
                  autoComplete="street-address"
                  className="flex-1 bg-transparent font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="font-sans text-sm font-medium text-texte-principal">
              Mot de passe <span className="text-bleu-institutionnel">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair">
              <LockIcon className="size-5 shrink-0 text-texte-tertiaire" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="• • • • • • • •"
                autoComplete="new-password"
                className="flex-1 bg-transparent font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((state) => !state)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="text-texte-tertiaire transition-colors hover:text-texte-secondaire"
              >
                {showPassword ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
              </button>
            </div>
          </div>

          <label className="mt-1 flex items-start gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={acceptTerms}
              onClick={() => setAcceptTerms((state) => !state)}
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                acceptTerms
                  ? "border-bleu-institutionnel bg-bleu-institutionnel text-texte-inverse"
                  : "border-bordure-forte bg-fond-page"
              }`}
            >
              {acceptTerms && <CheckIcon className="size-3.5" />}
            </button>
            <span className="font-sans text-sm text-texte-principal">
              J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité.
            </span>
          </label>

          <button
            type="submit"
            className="mt-1 flex w-full items-center justify-center gap-1 overflow-hidden rounded-[10px] bg-bleu-institutionnel bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%)] p-2.5 shadow-[0px_0px_0px_1px_var(--color-bleu-institutionnel),0px_1px_2px_0px_rgba(14,18,27,0.24)] outline outline-1 -outline-offset-1 outline-white/10 transition hover:brightness-110"
          >
            <span className="px-1 font-sans text-sm font-medium leading-5 text-texte-inverse">
              Créer mon compte
            </span>
          </button>
        </form>
      </div>

      <footer className="flex items-center justify-between">
        <span className="font-sans text-sm text-texte-secondaire">© 2025 ProfilsActifs</span>
        <button
          type="button"
          className="flex items-center gap-1 font-sans text-sm text-texte-secondaire transition-colors hover:text-texte-principal"
        >
          <GlobeIcon className="size-4" />
          FR
          <ChevronDownIcon className="size-4" />
        </button>
      </footer>
    </div>
  );
}
