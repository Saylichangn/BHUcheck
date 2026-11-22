import type { ClaimStatus } from "@/lib/domain/claims";
import type { FieldKey } from "@/lib/domain/fields";
import { fieldLabels, isFieldKey } from "@/lib/domain/fields";
import type { ComparisonInput, ComparisonResult } from "./compare";
import { buildComparisons } from "./compare";
import {
  compareFieldValues,
  normalizeFieldValue,
  type Agreement,
} from "./values";

export type EvaluatedClaim = {
  id: string;
  text: string;
  fieldKey: FieldKey | null;
  status: ClaimStatus;
  rationale: string;
  evidenceDocumentId: string | null;
  evidenceFieldId: string | null;
};

function truncate(value: string, length: number) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}

function judge(
  agreements: Agreement[],
): "supported" | "contradicted" | "mixed" | "possible" | "none" {
  const matches = agreements.filter((agreement) => agreement === "match").length;
  const mismatches = agreements.filter(
    (agreement) => agreement === "mismatch",
  ).length;
  const possible = agreements.filter(
    (agreement) => agreement === "possible_variant",
  ).length;

  if (mismatches > 0 && matches > 0) return "mixed";
  if (mismatches > 0) return "contradicted";
  if (matches > 0) return "supported";
  if (possible > 0) return "possible";
  return "none";
}

export function evaluateClaims(
  input: ComparisonInput,
  comparison: ComparisonResult = buildComparisons(input),
): EvaluatedClaim[] {
  return input.claims.map((claim) => {
    const fieldKey: FieldKey | null =
      claim.fieldKey && isFieldKey(claim.fieldKey) ? claim.fieldKey : null;

    const unresolved = (rationale: string): EvaluatedClaim => ({
      id: claim.id,
      text: claim.text,
      fieldKey,
      status: "unverified",
      rationale,
      evidenceDocumentId: null,
      evidenceFieldId: null,
    });

    if (!fieldKey || !comparison.byField.has(fieldKey)) {
      return unresolved(
        "This statement is not linked to a comparable field, so it was not checked against the documents.",
      );
    }

    if (!claim.claimedValue?.trim()) {
      return unresolved(
        "No value was entered for this statement, so there was nothing to compare.",
      );
    }

    const claimed = normalizeFieldValue(
      fieldKey,
      claim.claimedValue,
      claim.claimedUnit,
    );

    if (!claimed.normalized) {
      return unresolved(
        "The claimed value could not be read automatically, so it was not checked.",
      );
    }

    const field = comparison.byField.get(fieldKey);

    if (!field) {
      return unresolved(
        "This field was not part of the comparison, so the statement was not checked.",
      );
    }

    const observations = field.observations.filter(
      (observation) => observation.sourceType !== "claim",
    );

    if (observations.length === 0) {
      return unresolved(
        `No uploaded document provides ${fieldLabels[
          fieldKey
        ].toLowerCase()}, so the statement could not be checked.`,
      );
    }

    const pairs = observations.map((observation) => ({
      observation,
      agreement: compareFieldValues(
        fieldKey,
        claimed,
        observation.normalized,
      ),
    }));

    const outcome = judge(pairs.map((pair) => pair.agreement));

    const pick = (agreement: Agreement) =>
      pairs.find((pair) => pair.agreement === agreement);

    if (outcome === "supported") {
      const match = pick("match") ?? pairs[0]!;

      return {
        id: claim.id,
        text: claim.text,
        fieldKey,
        status: "supported",
        rationale: `The statement matches the value read from ${match.observation.sourceLabel}.`,
        evidenceDocumentId: match.observation.documentId,
        evidenceFieldId: match.observation.fieldId,
      };
    }

    if (outcome === "contradicted") {
      const mismatch = pick("mismatch") ?? pairs[0]!;

      return {
        id: claim.id,
        text: claim.text,
        fieldKey,
        status: "contradicted",
        rationale: `The statement does not match ${mismatch.observation.sourceLabel}, which reads "${truncate(mismatch.observation.value, 120)}".`,
        evidenceDocumentId: mismatch.observation.documentId,
        evidenceFieldId: mismatch.observation.fieldId,
      };
    }

    if (outcome === "mixed") {
      const mismatch = pick("mismatch") ?? pairs[0]!;

      return {
        id: claim.id,
        text: claim.text,
        fieldKey,
        status: "unverified",
        rationale:
          "One source agrees with the statement and another does not. Review the comparison table.",
        evidenceDocumentId: mismatch.observation.documentId,
        evidenceFieldId: mismatch.observation.fieldId,
      };
    }

    if (outcome === "possible") {
      const variant = pick("possible_variant") ?? pairs[0]!;

      return {
        id: claim.id,
        text: claim.text,
        fieldKey,
        status: "unverified",
        rationale: `The closest source, ${variant.observation.sourceLabel}, is similar but not identical. Check the exact value.`,
        evidenceDocumentId: variant.observation.documentId,
        evidenceFieldId: variant.observation.fieldId,
      };
    }

    return unresolved(
      "The available document values could not be compared with the statement automatically.",
    );
  });
}
