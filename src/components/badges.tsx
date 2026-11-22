import { Badge } from "@/components/ui";
import { alertLevelLabels, type AlertLevel } from "@/lib/domain/alerts";
import type { ChecklistStatus } from "@/lib/domain/checklist";
import { claimStatusLabels, type ClaimStatus } from "@/lib/domain/claims";
import type { ComparisonStatus } from "@/lib/domain/engine/compare";
import { comparisonStatusLabels } from "@/lib/domain/engine/compare";
import type { ExtractionStatus } from "@/lib/documents/types";
import { extractionStatusLabels } from "@/lib/documents/types";

export function LevelBadge({ level }: { level: AlertLevel }) {
  const tone =
    level === "critical" || level === "high"
      ? "danger"
      : level === "medium" || level === "review"
        ? "warn"
        : level === "checked"
          ? "ok"
          : "neutral";

  return <Badge tone={tone}>{alertLevelLabels[level]}</Badge>;
}

export function ComparisonBadge({ status }: { status: ComparisonStatus }) {
  const tone =
    status === "inconsistency"
      ? "danger"
      : status === "possible_inconsistency"
        ? "warn"
        : status === "match"
          ? "ok"
          : "neutral";

  return <Badge tone={tone}>{comparisonStatusLabels[status]}</Badge>;
}

export function ChecklistBadge({ status }: { status: ChecklistStatus }) {
  const label =
    status === "satisfied"
      ? "Uploaded"
      : status === "missing"
        ? "Missing"
        : status === "obtain"
          ? "Obtain"
          : status === "not_applicable"
            ? "Not applicable"
            : "Unconfirmed";
  const tone =
    status === "satisfied"
      ? "ok"
      : status === "missing"
        ? "danger"
        : status === "obtain"
          ? "warn"
          : "neutral";

  return <Badge tone={tone}>{label}</Badge>;
}

export function ClaimBadge({ status }: { status: ClaimStatus }) {
  const tone =
    status === "supported"
      ? "ok"
      : status === "contradicted"
        ? "danger"
        : "neutral";

  return <Badge tone={tone}>{claimStatusLabels[status]}</Badge>;
}

export function ExtractionBadge({ status }: { status: string }) {
  const known = (
    ["pending", "extracted", "ocr", "empty", "failed"] as const
  ).includes(status as ExtractionStatus);
  const label = known
    ? extractionStatusLabels[status as ExtractionStatus]
    : "Unknown";
  const tone =
    status === "extracted" || status === "ocr"
      ? "ok"
      : status === "failed" || status === "empty"
        ? "warn"
        : "neutral";

  return <Badge tone={tone}>{label}</Badge>;
}
