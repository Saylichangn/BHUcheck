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
      <p className="text-sm">
        {checkedCount} checked · {items.length - checkedCount} unchecked
      </p>
      <p className="mt-1 text-xs text-muted">
        Tap CHECKED when a requirement has been completed.
      </p>

      {visibleGroups.map((group) => (
        <div key={group.label} className="mt-6">
          <h3 className="text-lg">{group.label}</h3>
          <div className="mt-2 overflow-x-auto border-t border-ink">
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
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted">
                          {item.requirement === "always"
                            ? "Always"
                            : "Conditional"}
                        </p>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {([false, true] as const).map((option) => (
                            <button
                              key={String(option)}
                              type="button"
                              aria-pressed={value === option}
                              onClick={() => setReview(item.key, option)}
                              className={`border px-2 py-1 font-mono text-[10px] uppercase ${
                                option
                                  ? value === option
                                    ? "border-ok bg-ok text-paper font-semibold"
                                    : "border-ok bg-ok-soft text-ok"
                                  : value === option
                                    ? "border-danger bg-danger text-paper font-semibold"
                                    : "border-danger bg-danger-soft text-danger"
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
                            className="mt-1 block"
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
          className="btn mt-4"
        >
          MORE
        </button>
      ) : null}

      <p className="mt-4 text-xs text-muted">
        CHECKED only means you say the requirement is completed. It does not
        mean a document is genuine or sufficient. Guidance steps happen outside
        BHUcheck.
      </p>
    </>
  );
}
