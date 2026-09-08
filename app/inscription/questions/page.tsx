"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  CloseIcon,
  InfoIcon,
  UserIcon,
} from "@/components/icons";
import QuestionStepper from "@/components/question-stepper";
import { useToast } from "@/components/toast";

type QuestionType =
  | "single-choice"
  | "multiple-choice"
  | "true-false"
  | "free-answer"
  | "date"
  | "numeric";

type ApiQuestion = {
  id: number;
  question: string;
  type: QuestionType;
  options?: {
    choices?: string[];
  };
};

type AnswerValue = string | string[] | boolean;

const TYPE_HINT: Record<QuestionType, string> = {
  "single-choice": "Choisissez une réponse.",
  "multiple-choice": "Plusieurs réponses possibles.",
  "true-false": "Vrai ou faux ?",
  "free-answer": "Rédigez votre réponse.",
  "date": "Indiquez une date.",
  "numeric": "Indiquez un nombre.",
};

function iconForType(type: QuestionType) {
  switch (type) {
    case "date":
      return CalendarIcon;
    case "true-false":
      return CheckIcon;
    case "single-choice":
    case "multiple-choice":
      return BriefcaseIcon;
    case "numeric":
      return InfoIcon;
    default:
      return UserIcon;
  }
}

function isAnswered(question: ApiQuestion, value: AnswerValue | undefined): boolean {
  if (value === undefined) {
    return false;
  }
  switch (question.type) {
    case "multiple-choice":
      return Array.isArray(value) && value.length > 0;
    case "true-false":
      return typeof value === "boolean";
    case "numeric":
      return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value));
    case "free-answer":
    case "date":
    case "single-choice":
      return typeof value === "string" && value.trim() !== "";
    default:
      return false;
  }
}

function payloadFor(question: ApiQuestion, value: AnswerValue): unknown {
  if (question.type === "numeric") {
    return Number(value);
  }
  return value;
}

export default function QuestionsPage() {
  const router = useRouter();
  const { showError } = useToast();
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [formVersion, setFormVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/form");
        if (!response.ok) {
          throw new Error("form unavailable");
        }
        const data = await response.json();
        const list: ApiQuestion[] = Array.isArray(data.questions)
          ? data.questions.map((item: ApiQuestion) => ({
              id: item.id,
              question: item.question,
              type: item.type,
              options: { choices: item.options?.choices ?? [] },
            }))
          : [];
        if (alive) {
          setQuestions(list);
          setFormVersion(
            typeof data.formVersion === "number" ? data.formVersion : null,
          );
          setStep(0);
        }
      } catch {
        if (alive) {
          showError("Impossible de charger le questionnaire.", "Formulaire indisponible");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [showError]);

  const question = questions[step];
  const isLast = questions.length > 0 && step === questions.length - 1;
  const currentAnswer = question ? answers[question.id] : undefined;
  const canContinue =
    Boolean(question && isAnswered(question, currentAnswer)) && !submitting;

  async function submitAnswers() {
    if (formVersion === null) {
      showError("Version du formulaire inconnue.", "Envoi impossible");
      return false;
    }

    for (const item of questions) {
      const value = answers[item.id];
      if (value === undefined || !isAnswered(item, value)) {
        showError("Répondez à toutes les questions avant de terminer.");
        return false;
      }
      const response = await fetch("/api/form/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formVersion,
          questionId: item.id,
          response: payloadFor(item, value),
        }),
      });
      if (!response.ok) {
        throw new Error("answer failed");
      }
    }
    return true;
  }

  async function goNext() {
    if (!canContinue) {
      return;
    }
    if (!isLast) {
      setStep((current) => current + 1);
      return;
    }

    setSubmitting(true);
    try {
      const saved = await submitAnswers();
      if (saved) {
        router.push("/");
      }
    } catch {
      showError(
        "Impossible d'enregistrer vos réponses.",
        "Questionnaire incomplet",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const Icon = question ? iconForType(question.type) : InfoIcon;

  function setAnswer(value: AnswerValue) {
    if (!question) {
      return;
    }
    setAnswers((current) => ({ ...current, [question.id]: value }));
  }

  function toggleChoice(choice: string) {
    const current = Array.isArray(currentAnswer) ? currentAnswer : [];
    setAnswer(
      current.includes(choice)
        ? current.filter((item) => item !== choice)
        : [...current, choice],
    );
  }

  function goBack() {
    if (step === 0) {
      router.push("/inscription/video");
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
        {questions.length > 0 && (
          <QuestionStepper current={step + 1} total={questions.length} />
        )}
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
          {loading ? (
            <p className="text-center font-sans text-sm text-texte-tertiaire">
              Chargement du questionnaire...
            </p>
          ) : !question ? (
            <p className="text-center font-sans text-sm text-texte-tertiaire">
              Aucune question disponible.
            </p>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-fond-neutre to-transparent p-4 outline outline-1 -outline-offset-1 outline-bordure-forte backdrop-blur">
                  <span className="flex size-16 items-center justify-center rounded-full bg-fond-page text-bleu-institutionnel shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] outline outline-1 -outline-offset-1 outline-bordure-defaut">
                    <Icon className="size-6" />
                  </span>
                </span>
                <div className="flex flex-col items-center gap-1 text-center">
                  <h1 className="font-sans text-2xl font-medium text-texte-principal">
                    {question.question}
                  </h1>
                  <p className="font-sans text-base text-texte-secondaire">
                    {TYPE_HINT[question.type]}
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-bordure-defaut" />

              <QuestionFields
                question={question}
                value={currentAnswer}
                onChange={setAnswer}
                onToggle={toggleChoice}
              />

              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue}
                className="flex w-full items-center justify-center gap-1 overflow-hidden rounded-[10px] bg-bleu-institutionnel bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%)] p-2.5 shadow-[0px_0px_0px_1px_var(--color-bleu-institutionnel),0px_1px_2px_0px_rgba(14,18,27,0.24)] outline outline-1 -outline-offset-1 outline-white/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
              >
                <span className="px-1 font-sans text-sm font-medium leading-5 text-texte-inverse">
                  {submitting
                    ? "Enregistrement..."
                    : isLast
                      ? "Terminer"
                      : "Continuer"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      <footer className="flex items-center px-11 py-6">
        <span className="font-sans text-sm text-texte-secondaire">© 2025 ProfilsActifs</span>
      </footer>
    </main>
  );
}

function QuestionFields({
  question,
  value,
  onChange,
  onToggle,
}: {
  question: ApiQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  onToggle: (choice: string) => void;
}) {
  if (question.type === "free-answer") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <label htmlFor="reponse" className="font-sans text-sm font-medium text-texte-principal">
          Votre réponse <span className="text-bleu-institutionnel">*</span>
        </label>
        <textarea
          id="reponse"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Saisissez votre réponse..."
          className="min-h-[120px] flex-1 resize-none rounded-[10px] border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm text-texte-principal shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] placeholder:text-texte-tertiaire focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
        />
      </div>
    );
  }

  if (question.type === "date") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <label htmlFor="reponse-date" className="font-sans text-sm font-medium text-texte-principal">
          Date <span className="text-bleu-institutionnel">*</span>
        </label>
        <input
          id="reponse-date"
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-[10px] border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm text-texte-principal shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair [color-scheme:light]"
        />
      </div>
    );
  }

  if (question.type === "numeric") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <label htmlFor="reponse-nombre" className="font-sans text-sm font-medium text-texte-principal">
          Nombre <span className="text-bleu-institutionnel">*</span>
        </label>
        <input
          id="reponse-nombre"
          type="number"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          className="rounded-[10px] border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm text-texte-principal shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] placeholder:text-texte-tertiaire focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
        />
      </div>
    );
  }

  if (question.type === "true-false") {
    return (
      <ChoiceList
        choices={["Vrai", "Faux"]}
        selected={
          value === true ? "Vrai" : value === false ? "Faux" : null
        }
        onSelect={(choice) => onChange(choice === "Vrai")}
      />
    );
  }

  const choices = question.options?.choices ?? [];
  const selectedSingle = typeof value === "string" ? value : null;
  const selectedMany = Array.isArray(value) ? value : [];

  return (
    <ChoiceList
      choices={choices}
      selected={
        question.type === "multiple-choice" ? selectedMany : selectedSingle
      }
      multiple={question.type === "multiple-choice"}
      onSelect={(choice) => {
        if (question.type === "multiple-choice") {
          onToggle(choice);
          return;
        }
        onChange(choice);
      }}
    />
  );
}

function ChoiceList({
  choices,
  selected,
  multiple = false,
  onSelect,
}: {
  choices: string[];
  selected: string | string[] | null;
  multiple?: boolean;
  onSelect: (choice: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      {choices.map((choice) => {
        const isSelected = Array.isArray(selected)
          ? selected.includes(choice)
          : selected === choice;
        return (
          <button
            key={choice}
            type="button"
            onClick={() => onSelect(choice)}
            className={`flex items-start gap-3.5 rounded-xl p-4 text-left transition-colors ${
              isSelected
                ? "border border-bleu-institutionnel bg-fond-page"
                : "border border-bordure-defaut bg-fond-page shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] hover:bg-fond-neutre"
            }`}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-sans text-sm font-medium text-texte-principal">
                {choice}
              </span>
            </span>
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center border ${
                multiple ? "rounded-md" : "rounded-full"
              } ${
                isSelected
                  ? "border-bleu-institutionnel bg-bleu-institutionnel"
                  : "border-bordure-forte bg-fond-page"
              }`}
            >
              {isSelected && (
                multiple ? (
                  <CheckIcon className="size-3 text-texte-inverse" />
                ) : (
                  <span className="size-2 rounded-full bg-fond-page" />
                )
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
