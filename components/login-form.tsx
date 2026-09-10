"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "@/components/icons";
import AuthUserBadge from "@/components/auth-user-badge";
import { authClient } from "@/lib/auth_client";
import { useToast } from "@/components/toast";

export default function LoginForm() {
  const router = useRouter();
  const { showError } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const { error: authError } = await authClient.signIn.email({
      email,
      password,
      rememberMe: keepLoggedIn,
    });
    setSubmitting(false);

    if (authError) {
      showError(authError.message ?? "Identifiants invalides.", "Connexion échouée");
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto p-8">
      <header className="flex items-center justify-between gap-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-bleu-institutionnel font-sans text-xs font-medium text-texte-inverse">
          PA
        </span>
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm text-texte-secondaire">
            Vous n&apos;avez pas de compte ?
          </span>
          <Link
            href="/inscription"
            className="rounded-lg bg-fond-bleu-clair px-2.5 py-1.5 font-sans text-sm font-medium text-bleu-institutionnel transition-colors hover:bg-fond-bleu-clair/70"
          >
            S&apos;inscrire
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[392px] flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <AuthUserBadge />
          <div className="text-center">
            <h1 className="font-sans text-2xl font-medium text-texte-principal">
              Connexion à votre compte
            </h1>
            <p className="font-sans text-base text-texte-secondaire">
              Saisissez vos identifiants pour vous connecter.
            </p>
          </div>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="font-sans text-sm font-medium text-texte-principal">
              Adresse e-mail <span className="text-bleu-institutionnel">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair">
              <MailIcon className="size-5 shrink-0 text-texte-tertiaire" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.fr"
                autoComplete="email"
                className="flex-1 bg-transparent font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="font-sans text-sm font-medium text-texte-principal">
              Mot de passe <span className="text-bleu-institutionnel">*</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair">
              <LockIcon className="size-5 shrink-0 text-texte-tertiaire" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="• • • • • • • •"
                autoComplete="current-password"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={keepLoggedIn}
                onClick={() => setKeepLoggedIn((state) => !state)}
                className={`flex size-5 items-center justify-center rounded-md border transition-colors ${
                  keepLoggedIn
                    ? "border-bleu-institutionnel bg-bleu-institutionnel text-texte-inverse"
                    : "border-bordure-forte bg-fond-page"
                }`}
              >
                {keepLoggedIn && <CheckIcon className="size-3.5" />}
              </button>
              <span className="font-sans text-sm text-texte-principal">Rester connecté</span>
            </label>
            <button
              type="button"
              className="font-sans text-sm font-medium text-texte-secondaire transition-colors hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex w-full items-center justify-center gap-1 overflow-hidden rounded-[10px] bg-bleu-institutionnel bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%)] p-2.5 shadow-[0px_0px_0px_1px_var(--color-bleu-institutionnel),0px_1px_2px_0px_rgba(14,18,27,0.24)] outline outline-1 -outline-offset-1 outline-white/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
          >
            <span className="px-1 font-sans text-sm font-medium leading-5 text-texte-inverse">
              {submitting ? "Connexion..." : "Se connecter"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
