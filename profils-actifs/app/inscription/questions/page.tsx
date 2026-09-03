"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  CloseIcon,
  GlobeIcon,
  InfoIcon,
  UserIcon,
} from "@/components/icons";
import QuestionStepper from "@/components/question-stepper";

type IconType = React.ComponentType<{ className?: string }>;

type Choice = {
  value: string;
  title: string;
  description: string;
  Icon: IconType;
};

type Question =
  | {
      type: "text";
      title: string;
      description: string;
      Icon: IconType;
      label: string;
      placeholder: string;
    }
  | {
      type: "choice";
      title: string;
      description: string;
      Icon: IconType;
      choices: Choice[];
    };

// Questionnaire d'inscription. Chaque entrée décrit une étape ; le type
// détermine le rendu (réponse libre ou choix unique). Ajouter une question
// ici met automatiquement à jour le nombre d'étapes de l'indicateur.
const questions: Question[] = [
  {
    type: "text",
    title: "Question #1",
    description: "Fournissez les informations essentielles pour continuer.",
    Icon: InfoIcon,
    label: "Votre réponse",
    placeholder: "Saisissez votre réponse...",
  },
  {
    type: "choice",
    title: "Question #2",
    description: "Choisissez votre rôle au sein de ProfilsActifs.",
    Icon: BriefcaseIcon,
    choices: [
      {
        value: "candidat",
        title: "Je suis un candidat",
        description: "Rejoignez la plateforme en tant que candidat.",
        Icon: UserIcon,
      },
      {
        value: "recruteur",
        title: "Je suis un recruteur",
        description: "Rejoignez la plateforme en tant que recruteur.",
        Icon: BriefcaseIcon,
      },
    ],
  },
];

export default function QuestionsPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<Record<number, string>>({});

  const question = questions[step];
  const isLast = step === questions.length - 1;
  const canContinue = question.type !== "choice" || Boolean(choices[step]);

  function goNext() {
    if (isLast) {
      router.push("/");
      return;
    }
    setStep((current) => current + 1);
  }

  function goBack() {
    if (step === 0) {
      router.push("/inscription");
      return;
    }
    setStep((current) => current - 1);
  }

  return (
    <main className="flex flex-1 flex-col bg-fond-page">
      <header className="flex items-center gap-6 border-b border-bordure-defaut px-11 py-6">
        <div className="flex flex-1 items-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-bleu-institutionnel font-sans text-sm font-medium text-texte-inverse">
            PA
          </span>
        </div>
        <QuestionStepper current={step + 1} total={questions.length} />
        <div className="flex flex-1 items-center justify-end">
          <Link
            href="/"
            aria-label="Fermer"
            className="rounded-[10px] p-2.5 text-texte-tertiaire transition-colors hover:bg-fond-neutre hover:text-texte-secondaire"
          >
            <CloseIcon className="size-5" />
          </Link>
        </div>
      </header>

      <div className="px-11 pt-8">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-0.5 rounded-lg border border-bordure-defaut bg-fond-page py-1.5 pl-1.5 pr-2.5 font-sans text-sm font-medium text-texte-secondaire shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] transition-colors hover:bg-fond-neutre"
        >
          <ChevronLeftIcon className="size-5" />
          Retour
        </button>
      </div>

      <div className="flex min-h-0 flex-1 justify-center px-6 py-6">
        <div className="flex h-full w-full max-w-[384px] flex-col gap-5">
          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-fond-neutre to-transparent p-4 outline outline-1 -outline-offset-1 outline-bordure-forte backdrop-blur">
              <span className="flex size-16 items-center justify-center rounded-full bg-fond-page text-bleu-institutionnel shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] outline outline-1 -outline-offset-1 outline-bordure-defaut">
                <question.Icon className="size-6" />
              </span>
            </span>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="font-sans text-2xl font-medium text-texte-principal">
                {question.title}
              </h1>
              <p className="font-sans text-base text-texte-secondaire">
                {question.description}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-bordure-defaut" />

          {question.type === "text" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-1">
              <label htmlFor="reponse" className="font-sans text-sm font-medium text-texte-principal">
                {question.label} <span className="text-bleu-institutionnel">*</span>
              </label>
              <textarea
                id="reponse"
                placeholder={question.placeholder}
                className="min-h-[120px] flex-1 resize-none rounded-[10px] border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm text-texte-principal shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] placeholder:text-texte-tertiaire focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
              {question.choices.map((choice) => {
                const selected = choices[step] === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() =>
                      setChoices((current) => ({ ...current, [step]: choice.value }))
                    }
                    className={`flex items-start gap-3.5 rounded-xl p-4 text-left transition-colors ${
                      selected
                        ? "border border-bleu-institutionnel bg-fond-page"
                        : "border border-bordure-defaut bg-fond-page shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] hover:bg-fond-neutre"
                    }`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fond-page text-texte-secondaire shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] outline outline-1 -outline-offset-1 outline-bordure-defaut">
                      <choice.Icon className="size-5" />
                    </span>
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="font-sans text-sm font-medium text-texte-principal">
                        {choice.title}
                      </span>
                      <span className="font-sans text-xs text-texte-secondaire">
                        {choice.description}
                      </span>
                    </span>
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-bleu-institutionnel bg-bleu-institutionnel"
                          : "border-bordure-forte bg-fond-page"
                      }`}
                    >
                      {selected && <span className="size-2 rounded-full bg-fond-page" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="flex w-full items-center justify-center gap-1 overflow-hidden rounded-[10px] bg-bleu-institutionnel bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%)] p-2.5 shadow-[0px_0px_0px_1px_var(--color-bleu-institutionnel),0px_1px_2px_0px_rgba(14,18,27,0.24)] outline outline-1 -outline-offset-1 outline-white/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
          >
            <span className="px-1 font-sans text-sm font-medium leading-5 text-texte-inverse">
              {isLast ? "Terminer" : "Continuer"}
            </span>
          </button>
        </div>
      </div>

      <footer className="flex items-center gap-3 px-11 py-6">
        <span className="flex-1 font-sans text-sm text-texte-secondaire">© 2025 ProfilsActifs</span>
        <button
          type="button"
          className="flex items-center gap-1 font-sans text-sm text-texte-secondaire transition-colors hover:text-texte-principal"
        >
          <GlobeIcon className="size-4" />
          FR
          <ChevronDownIcon className="size-4" />
        </button>
      </footer>
    </main>
  );
}
