"use client";

import { useState } from "react";
import { Badge, Notice } from "@/components/ui";
import { governmentSources } from "@/lib/domain/sources";
import type { InvestigationDetail } from "@/lib/investigations/service";

const sourceNames = new Map(
  governmentSources.map((source) => [source.slug, source.name]),
);

function grouped(items: InvestigationDetail["checklist"]) {
  const groups: Array<{ label: string; items: typeof items }> = [];

  for (const item of items) {
    const last = groups[groups.length - 1];

    if (last && last.label === item.groupLabel) {
      last.items.push(item);
    } else {
      groups.push({ label: item.groupLabel, items: [item] });
    }
  }

  return groups;
}

export function ChecklistSection({
  items,
  investigationId,
  initialReviews = {},
}: {
  items: InvestigationDetail["checklist"];
  investigationId: string;
  initialReviews?: Record<string, boolean>;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      items.map((item) => [item.key, initialReviews[item.key] ?? false]),
    ),
  );
  const [showAllGroups, setShowAllGroups] = useState(false);

  const checkedCount = Object.values(checked).filter(Boolean).length;

  async function setReview(key: string, value: boolean) {
    setChecked((current) => ({ ...current, [key]: value }));

    try {
      await fetch("/api/checklist/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationId,
          requirementKey: key,
          checked: value,
        }),
      });
    } catch {
      // The choice stays visible even if it could not be saved.
    }
  }

  if (items.length === 0) {
    return (
      <Notice title="Checklist not built">
        The checklist is rebuilt when the investigation is saved or a document
        changes. Reload the page if it stays empty.
      </Notice>
    );
  }

  const groups = grouped(items);
  const visibleGroups = showAllGroups ? groups : groups.slice(0, 1);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5 border border-ink bg-sheet px-5 py-4">
        <div>
          <p className="font-serif text-[1.5rem] leading-none tracking-[-0.02em]">
            {checkedCount} checked · {items.length - checkedCount} unchecked
          </p>
          <p className="mt-2 text-xs text-muted">
            Tap CHECKED when a requirement has been completed.
          </p>
        </div>
        <span aria-hidden="true" className="h-3 w-3 bg-lime" />
      </div>

      {visibleGroups.map((group) => (
        <div key={group.label} className="mt-8">
          <h3 className="border-b border-ink pb-3 text-[1.6rem]">
            {group.label}
          </h3>
          <div className="mt-3 overflow-x-auto border border-ink bg-sheet">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th scope="col">Requirement</th>
                  <th scope="col">Status</th>
                  <th scope="col">Authority</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => {
                  const value = checked[item.key] ?? false;

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="font-medium">{item.label}</span>
                        {item.guidanceOnly ? (
                          <span className="ml-2">
                            <Badge>Guidance step</Badge>
                          </span>
                        ) : null}
                        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.13em] text-muted">
                          {item.requirement === "always"
                            ? "Always"
                            : "Conditional"}
                        </p>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {([false, true] as const).map((option) => (
                            <button
                              key={String(option)}
                              type="button"
                              aria-pressed={value === option}
                              onClick={() => setReview(item.key, option)}
                              className={`border px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.07em] transition-colors ${
                                option
                                  ? value === option
                                    ? "border-ok bg-ok font-semibold text-white"
                                    : "border-ok/40 bg-ok-soft text-ok hover:border-ok"
                                  : value === option
                                    ? "border-danger bg-danger font-semibold text-white"
                                    : "border-danger/40 bg-danger-soft text-danger hover:border-danger"
                              }`}
                            >
                              {option ? "CHECKED" : "UNCHECKED"}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>{item.authority}</td>
                      <td className="max-w-xl text-xs leading-relaxed">
                        {item.note}
                        {item.sourceSlug ? (
                          <a
                            href={`/sources#${item.sourceSlug}`}
                            className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]"
                          >
                            {sourceNames.get(item.sourceSlug) ??
                              "Government source"}
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {!showAllGroups && groups.length > 1 ? (
        <button
          type="button"
          onClick={() => setShowAllGroups(true)}
          className="btn mt-6"
        >
          MORE
        </button>
      ) : null}

      <p className="mt-5 max-w-3xl border-t border-rule pt-4 text-xs leading-relaxed text-muted">
        CHECKED only means you say the requirement is completed. It does not
        mean a document is genuine or sufficient. Guidance steps happen outside
        BHUcheck.
      </p>
    </>
  );
}
