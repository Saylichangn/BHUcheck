"use client";

import { useState } from "react";
import {
  questionnaireQuestions,
  questionnaireStatusLabels,
  type QuestionnaireAnswer,
  type QuestionnaireStatus,
} from "@/lib/domain/questionnaire";
import type { SourceLink } from "@/lib/questionnaire/lookup";

type LookupState = {
  links: SourceLink[];
  summary: string | null;
  message: string | null;
};

const statusOrder: QuestionnaireStatus[] = ["no_problem", "problem", "unsure"];

export function QuestionnaireSection({
  investigationId,
  state = "India",
  initialAnswers = {},
  canSave = false,
}: {
  investigationId?: string;
  state?: string;
  initialAnswers?: Record<string, QuestionnaireAnswer>;
  canSave?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, QuestionnaireAnswer>>(
    () =>
      Object.fromEntries(
        questionnaireQuestions.map((question) => [
          question.key,
          {
            status: initialAnswers[question.key]?.status ?? "unsure",
            note: initialAnswers[question.key]?.note ?? "",
          },
        ]),
      ),
  );
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [lookups, setLookups] = useState<Record<string, LookupState>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  function toggle(key: string) {
    setOpen((current) => {
      const next = new Set(current);

      if (next.has(key)) next.delete(key);
      else next.add(key);

      return next;
    });
  }

  async function persist(key: string, answer: QuestionnaireAnswer) {
    if (!canSave || !investigationId) return;

    try {
      await fetch("/api/questionnaire/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationId,
          questionKey: key,
          status: answer.status,
          note: answer.note,
        }),
      });
    } catch {
      // Keep the visible answer even when it could not be saved.
    }
  }

  async function setOutcome(key: string, status: QuestionnaireStatus) {
    const next = { status, note: answers[key]?.note ?? "" };

    setAnswers((current) => ({ ...current, [key]: next }));
    void persist(key, next);
    setBusy(key);

    try {
      const response = await fetch("/api/questionnaire/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionKey: key,
          state,
          investigationId: canSave ? investigationId : undefined,
        }),
      });

      if (!response.ok) throw new Error("Lookup failed.");

      const result = (await response.json()) as LookupState;
      setLookups((current) => ({ ...current, [key]: result }));
    } catch {
      setLookups((current) => ({
        ...current,
        [key]: {
          links: [],
          summary: null,
          message:
            "Sources could not be loaded. The questionnaire still works.",
        },
      }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p className="text-sm text-muted">
        {questionnaireQuestions.length} questions. Each starts as{" "}
        <span className="font-mono text-xs">NOT SURE</span>. Record what you
        found, not just that you checked. Open the symbol beside a question to
        see what to ask or check.
      </p>

      <div className="mt-4 border-t border-ink">
        {questionnaireQuestions.slice(0, visibleCount).map((question) => {
          const isOpen = open.has(question.key);
          const answer = answers[question.key] ?? {
            status: "unsure",
            note: "",
          };
          const lookup = lookups[question.key];

          return (
            <article
              key={question.key}
              className="border-b border-rule py-4 first:border-t-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mono-label">
                    {String(question.number).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 text-base leading-snug">
                    {question.text}
                  </h3>
                </div>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Hide action" : "Show action"}
                  onClick={() => toggle(question.key)}
                  className="mono-label flex h-7 w-7 shrink-0 items-center justify-center border border-rule-strong text-base leading-none"
                >
                  {isOpen ? "−" : "+"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {statusOrder.map((status) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={answer.status === status}
                    onClick={() => setOutcome(question.key, status)}
                    className={`border px-2 py-1 font-mono text-xs uppercase ${
                      answer.status === status
                        ? "border-ink bg-ink text-paper"
                        : "border-rule-strong text-muted"
                    }`}
                  >
                    {questionnaireStatusLabels[status]}
                  </button>
                ))}
                {busy === question.key ? (
                  <span className="mono-label self-center">Looking…</span>
                ) : null}
              </div>


              {isOpen ? (
                <div className="mt-3 border-l-2 border-rule-strong pl-3">
                  <p className="text-sm leading-relaxed">{question.action}</p>
                </div>
              ) : null}

              {lookup ? (
                <div className="mt-3 space-y-2">
                  {lookup.message ? (
                    <p className="text-xs text-muted">{lookup.message}</p>
                  ) : null}
                  {lookup.summary ? (
                    <p className="text-sm leading-relaxed">{lookup.summary}</p>
                  ) : null}
                  {lookup.links.length > 0 ? (
                    <ul className="space-y-1">
                      {lookup.links.map((link) => (
                        <li key={link.url} className="text-xs">
                          <a href={link.url} target="_blank" rel="noreferrer">
                            {link.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {visibleCount < questionnaireQuestions.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + 10)}
          className="btn mt-4"
        >
          MORE
        </button>
      ) : null}

      <p className="mt-3 text-xs text-muted">
        Your outcome and note are saved with the investigation. A problem found
        creates an alert and appears in the report. Links are starting points
        from official sources, not legal advice.
      </p>
    </div>
  );
}
