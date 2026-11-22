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
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mono-label">Rules that ran</p>
        {ran.length === 0 ? (
          <p className="mt-1 text-sm text-muted">None.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {ran.map((rule) => (
              <li key={rule.key}>{rule.label}</li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mono-label">Rules that could not run</p>
        {skipped.length === 0 ? (
          <p className="mt-1 text-sm text-muted">None.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
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
      <div className="mt-3">
        {items.map((alert) => (
          <article
            key={alert.id}
            className={`border-t border-rule py-5 first:border-t-0 first:pt-0 ${
              alert.resolved ? "opacity-60" : ""
            }`}
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
            <h3 className="mt-2 text-xl">{alert.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed">
              {alert.explanation}
            </p>

            {alert.claimId && alert.evidenceValue ? (
              <p className="mt-3 max-w-3xl text-sm">
                <span className="mono-label mr-2">Seller statement</span>
                {alert.evidenceValue}
              </p>
            ) : null}

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="mono-label">Why it matters</dt>
                <dd className="mt-1 text-sm leading-relaxed">
                  {alert.whyItMatters}
                </dd>
              </div>
              <div>
                <dt className="mono-label">Next step</dt>
                <dd className="mt-1 text-sm leading-relaxed">
                  {alert.nextStep}
                </dd>
              </div>
            </dl>

            {alert.professionalAdvice !== "none" ? (
              <p className="mt-3 text-sm">
                <span className="mono-label mr-2">Professional review</span>
                {
                  professionalAdviceLabels[
                    alert.professionalAdvice as ProfessionalAdvice
                  ]
                }
              </p>
            ) : null}

            <p className="mt-3 text-xs text-muted">
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

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === alert.id}
                onClick={() => review(alert, "resolved")}
                className="border border-rule-strong px-2 py-1 font-mono text-[10px] uppercase disabled:opacity-50"
              >
                {alert.resolved ? "Resolved" : "Mark resolved"}
              </button>
              <button
                type="button"
                disabled={busy === alert.id}
                onClick={() => review(alert, "reviewed")}
                className="border border-rule-strong px-2 py-1 font-mono text-[10px] uppercase disabled:opacity-50"
              >
                {alert.reviewedAt ? "Reviewed" : "Mark reviewed"}
              </button>
            </div>
          </article>
        ))}
      </div>
      <RuleStatusList status={ruleStatus} />
      <p className="mt-2 border-t border-rule pt-3 text-xs text-muted">
        AI analysis reads the submitted statement only. It does not verify the
        seller, the property or any document, and it does not declare fraud.
        Confirm potential inconsistencies with the issuing authority.
      </p>
    </>
  );
}
