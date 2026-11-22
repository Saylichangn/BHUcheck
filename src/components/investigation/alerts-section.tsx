"use client";

import { useState } from "react";
import { LevelBadge } from "@/components/badges";
import { Badge, Notice } from "@/components/ui";
import {
  professionalAdviceLabels,
  type ProfessionalAdvice,
} from "@/lib/domain/alerts";
import type { FraudTag } from "@/lib/domain/tags";
import { fraudTagLabels } from "@/lib/domain/tags";
import { formatDate, formatDateTime, plural } from "@/lib/format";
import type { AlertView, RuleStatusView } from "@/lib/investigations/service";

function tagLabel(tag: string) {
  return tag in fraudTagLabels
    ? fraudTagLabels[tag as FraudTag]
    : tag.replaceAll("_", " ");
}

function RuleStatusList({ status }: { status: RuleStatusView[] }) {
  const ran = status.filter((rule) => rule.status === "ran");
  const skipped = status.filter((rule) => rule.status === "skipped");

  return (
    <div className="mt-6 grid border border-rule-strong bg-sheet sm:grid-cols-2">
      <div className="p-4">
        <p className="mono-label">Rules that ran</p>
        {ran.length === 0 ? (
          <p className="mt-2 text-sm text-muted">None.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {ran.map((rule) => (
              <li key={rule.key}>{rule.label}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-rule p-4 sm:border-l sm:border-t-0">
        <p className="mono-label">Rules that could not run</p>
        {skipped.length === 0 ? (
          <p className="mt-2 text-sm text-muted">None.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {skipped.map((rule) => (
              <li key={rule.key}>
                {rule.label} — {rule.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function accentFor(level: AlertView["level"]) {
  if (level === "critical" || level === "high") return "border-l-danger";
  if (level === "medium" || level === "review") return "border-l-warn";
  if (level === "checked") return "border-l-ok";
  return "border-l-forest";
}

export function AlertsSection({
  alerts,
  ruleStatus,
}: {
  alerts: AlertView[];
  ruleStatus: RuleStatusView[];
}) {
  const [items, setItems] = useState(alerts);
  const [busy, setBusy] = useState<string | null>(null);

  async function review(alert: AlertView, action: "resolved" | "reviewed") {
    setBusy(alert.id);

    try {
      const response = await fetch(`/api/alerts/${alert.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "resolved" ? { value: !alert.resolved } : {}),
        }),
      });

      if (!response.ok) return;

      setItems((current) =>
        current.map((item) => {
          if (item.id !== alert.id) return item;

          return action === "resolved"
            ? { ...item, resolved: !alert.resolved }
            : {
                ...item,
                reviewedAt: alert.reviewedAt ? null : new Date(),
              };
        }),
      );
    } catch {
      // The existing alert is left unchanged if the update fails.
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    const ranCount = ruleStatus.filter((rule) => rule.status === "ran").length;

    return (
      <>
        <Notice
          tone="warn"
          title={ranCount === 0 ? "No rules ran" : "No alerts raised"}
        >
          {ranCount === 0
            ? "No rules ran. Upload a 7/12 to start."
            : "The rules listed below ran and did not raise an alert. This is not a clearance."}
        </Notice>
        <RuleStatusList status={ruleStatus} />
      </>
    );
  }

  return (
    <>
      <p className="mono-label">{plural(items.length, "alert")} recorded</p>
      <div className="mt-4 space-y-4">
        {items.map((alert) => (
          <article
            key={alert.id}
            className={`border border-l-4 border-rule-strong bg-sheet p-5 ${accentFor(
              alert.level,
            )} ${alert.resolved ? "opacity-60" : ""}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={alert.level} />
              <Badge>{tagLabel(alert.tag)}</Badge>
              {alert.source === "ai" ? (
                <Badge tone="accent">AI analysis</Badge>
              ) : null}
              {alert.resolved ? <Badge tone="ok">Resolved</Badge> : null}
              {alert.reviewedAt ? <Badge>Reviewed</Badge> : null}
              <span className="font-mono text-[10px] text-muted">
                {alert.ruleKey}
              </span>
            </div>

            <h3 className="mt-3 max-w-3xl text-[1.45rem] leading-[1.15]">
              {alert.title}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-[1.7]">
              {alert.explanation}
            </p>

            {alert.claimId && alert.evidenceValue ? (
              <p className="mt-4 max-w-3xl border-l-2 border-rule-strong pl-3 text-sm">
                <span className="mono-label mr-2">Seller statement</span>
                {alert.evidenceValue}
              </p>
            ) : null}

            <dl className="mt-5 grid gap-5 border-t border-rule pt-5 sm:grid-cols-2">
              <div>
                <dt className="mono-label">Why it matters</dt>
                <dd className="mt-2 max-w-lg text-sm leading-[1.7]">
                  {alert.whyItMatters}
                </dd>
              </div>
              <div>
                <dt className="mono-label">Next step</dt>
                <dd className="mt-2 max-w-lg text-sm leading-[1.7]">
                  {alert.nextStep}
                </dd>
              </div>
            </dl>

            {alert.professionalAdvice !== "none" ? (
              <p className="mt-4 text-sm">
                <span className="mono-label mr-2">Professional review</span>
                {
                  professionalAdviceLabels[
                    alert.professionalAdvice as ProfessionalAdvice
                  ]
                }
              </p>
            ) : null}

            <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted">
              Source: {alert.sourceLabel}
              {alert.documentDate
                ? ` · document dated ${formatDate(alert.documentDate)}`
                : ""}
              {!alert.claimId && alert.evidenceValue
                ? ` · value: ${alert.evidenceValue}`
                : ""}
              {" · checked "}
              {formatDateTime(alert.checkedAt)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-rule pt-4">
              <button
                type="button"
                disabled={busy === alert.id}
                onClick={() => review(alert, "resolved")}
                className="btn px-3 py-2 text-[9.5px]"
              >
                {alert.resolved ? "Resolved" : "Mark resolved"}
              </button>
              <button
                type="button"
                disabled={busy === alert.id}
                onClick={() => review(alert, "reviewed")}
                className="btn px-3 py-2 text-[9.5px]"
              >
                {alert.reviewedAt ? "Reviewed" : "Mark reviewed"}
              </button>
            </div>
          </article>
        ))}
      </div>
      <RuleStatusList status={ruleStatus} />
      <p className="mt-4 max-w-3xl border-t border-rule pt-4 text-xs leading-relaxed text-muted">
        AI analysis reads the submitted statement only. It does not verify the
        seller, the property or any document, and it does not declare fraud.
        Confirm potential inconsistencies with the issuing authority.
      </p>
    </>
  );
}
