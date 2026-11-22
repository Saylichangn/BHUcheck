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
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink pb-6">
        <p className="max-w-2xl text-sm leading-[1.7] text-muted">
          {questionnaireQuestions.length} questions. Each starts as{" "}
          <span className="font-mono text-xs">NOT SURE</span>. Record what you
          found, not just that you checked. Open the symbol beside a question to
          see what to ask or check.
        </p>
        <span
          aria-hidden="true"
          className="mt-1 hidden h-3 w-3 shrink-0 bg-lime sm:block"
        />
      </div>

      <div>
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
              className="grid gap-3 border-b border-rule py-7 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-5"
            >
              <p className="mono-label pt-1.5 text-[11px]">
                {String(question.number).padStart(2, "0")}
              </p>

              <div className="min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="max-w-3xl font-serif text-[1.25rem] font-semibold leading-[1.28] tracking-[-0.012em]">
                    {question.text}
                  </h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={isOpen ? "Hide action" : "Show action"}
                    onClick={() => toggle(question.key)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink font-mono text-base leading-none text-ink transition-colors hover:bg-ink hover:text-paper"
                  >
                    {isOpen ? "−" : "+"}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex flex-wrap gap-px border border-ink bg-ink">
                    {statusOrder.map((status) => (
                      <button
                        key={status}
                        type="button"
                        aria-pressed={answer.status === status}
                        onClick={() => setOutcome(question.key, status)}
                        className={`px-3 py-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.08em] transition-colors ${
                          answer.status === status
                            ? "bg-ink text-paper"
                            : "bg-sheet text-muted hover:bg-lime hover:text-ink"
                        }`}
                      >
                        {questionnaireStatusLabels[status]}
                      </button>
                    ))}
                  </div>
                  {busy === question.key ? (
                    <span className="mono-label self-center">Looking…</span>
                  ) : null}
                </div>

                {isOpen ? (
                  <div className="mt-4 border-l-[3px] border-lime bg-forest/[0.04] px-4 py-3">
                    <p className="max-w-3xl text-sm leading-[1.7]">
                      {question.action}
                    </p>
                  </div>
                ) : null}

                {lookup ? (
                  <div className="mt-4 max-w-3xl space-y-2 border-t border-rule pt-3">
                    {lookup.message ? (
                      <p className="text-xs text-muted">{lookup.message}</p>
                    ) : null}
                    {lookup.summary ? (
                      <p className="text-sm leading-[1.7]">{lookup.summary}</p>
                    ) : null}
                    {lookup.links.length > 0 ? (
                      <ul className="space-y-1.5">
                        {lookup.links.map((link) => (
                          <li
                            key={link.url}
                            className="flex gap-2 font-mono text-[10.5px] leading-relaxed"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 12 12"
                              className="mt-0.5 h-3 w-3 shrink-0 text-forest"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                            >
                              <path d="M2 10 10 2M4 2h6v6" />
                            </svg>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline-offset-4"
                            >
                              {link.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {visibleCount < questionnaireQuestions.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + 10)}
          className="btn mt-6"
        >
          MORE
        </button>
      ) : null}

      <p className="mt-5 max-w-3xl border-t border-rule pt-4 text-xs leading-relaxed text-muted">
        Your outcome and note are saved with the investigation. A problem found
        creates an alert and appears in the report. Links are starting points
        from official sources, not legal advice.
      </p>
    </div>
  );
}
