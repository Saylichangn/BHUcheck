import type { DocumentType } from "@/lib/documents/types";
import { documentLabel } from "@/lib/documents/types";
import type { FieldKey } from "@/lib/domain/fields";
import {
  comparableFieldKeys,
  fieldKeyValues,
  fieldLabels,
  isFieldKey,
} from "@/lib/domain/fields";
import type { IntendedUse } from "@/lib/investigations/types";
import {
  compareFieldValues,
  normalizeFieldValue,
  type Agreement,
  type NormalizedValue,
} from "./values";

export const comparisonStatusValues = [
  "match",
  "possible_inconsistency",
  "inconsistency",
  "insufficient_data",
  "not_available",
] as const;

export type ComparisonStatus = (typeof comparisonStatusValues)[number];

export const comparisonStatusLabels: Record<ComparisonStatus, string> = {
  match: "Match",
  possible_inconsistency: "Possible variation",
  inconsistency: "Inconsistency",
  insufficient_data: "One source only",
  not_available: "Not available",
};

export type ComparisonInvestigation = {
  surveyNo: string | null;
  village: string | null;
  taluka: string | null;
  district: string | null;
  intendedUse: IntendedUse;
};

export type ComparisonDocumentField = {
  id: string;
  fieldKey: string;
  ordinal: number;
  value: string;
  unit: string | null;
  sourceText: string | null;
};

export type ComparisonDocument = {
  id: string;
  type: DocumentType;
  originalName: string;
  uploadedAt: Date;
  fields: ComparisonDocumentField[];
};

export type ComparisonClaim = {
  id: string;
  text: string;
  fieldKey: string | null;
  claimedValue: string | null;
  claimedUnit: string | null;
};

export type Observation = {
  fieldKey: FieldKey;
  sourceType: "investigation" | "document" | "claim";
  sourceId: string | null;
  sourceLabel: string;
  documentId: string | null;
  documentType: DocumentType | null;
  fieldId: string | null;
  fieldOrdinal: number | null;
  value: string;
  sourceText: string | null;
  normalized: NormalizedValue;
};

export type ComparedField = {
  fieldKey: FieldKey;
  label: string;
  status: ComparisonStatus;
  note: string;
  observations: Observation[];
};

export type ComparisonResult = {
  fields: ComparedField[];
  byField: Map<FieldKey, ComparedField>;
};

export type ComparisonInput = {
  investigation: ComparisonInvestigation;
  documents: ComparisonDocument[];
  claims: ComparisonClaim[];
};

const comparableSet = new Set<FieldKey>(comparableFieldKeys);

function investigationObservations(
  investigation: ComparisonInvestigation,
): Observation[] {
  const values: Array<[FieldKey, string | null]> = [
    ["survey_no", investigation.surveyNo],
    ["village", investigation.village],
    ["taluka", investigation.taluka],
    ["district", investigation.district],
  ];

  return values.flatMap(([fieldKey, value]) => {
    if (!value?.trim()) return [];

    return [
      {
        fieldKey,
        sourceType: "investigation" as const,
        sourceId: null,
        sourceLabel: "Investigation details",
        documentId: null,
        documentType: null,
        fieldId: null,
        fieldOrdinal: null,
        value,
        sourceText: null,
        normalized: normalizeFieldValue(fieldKey, value),
      },
    ];
  });
}

function documentObservations(documents: ComparisonDocument[]): Observation[] {
  return documents.flatMap((document) =>
    document.fields.flatMap((field) => {
      if (!isFieldKey(field.fieldKey)) return [];
      if (!comparableSet.has(field.fieldKey)) return [];

      return [
        {
          fieldKey: field.fieldKey,
          sourceType: "document" as const,
          sourceId: document.id,
          sourceLabel: document.originalName,
          documentId: document.id,
          documentType: document.type,
          fieldId: field.id,
          fieldOrdinal: field.ordinal,
          value: field.value,
          sourceText: field.sourceText,
          normalized: normalizeFieldValue(
            field.fieldKey,
            field.value,
            field.unit,
          ),
        },
      ];
    }),
  );
}

function claimObservations(claims: ComparisonClaim[]): Observation[] {
  return claims.flatMap((claim) => {
    if (!claim.fieldKey || !isFieldKey(claim.fieldKey)) return [];
    if (!comparableSet.has(claim.fieldKey)) return [];
    if (!claim.claimedValue?.trim()) return [];

    return [
      {
        fieldKey: claim.fieldKey,
        sourceType: "claim" as const,
        sourceId: claim.id,
        sourceLabel: "Seller statement",
        documentId: null,
        documentType: null,
        fieldId: null,
        fieldOrdinal: null,
        value: claim.claimedValue,
        sourceText: claim.text,
        normalized: normalizeFieldValue(
          claim.fieldKey,
          claim.claimedValue,
          claim.claimedUnit,
        ),
      },
    ];
  });
}

function statusFromAgreements(agreements: Agreement[]): ComparisonStatus {
  if (agreements.length === 0) return "insufficient_data";
  if (agreements.includes("mismatch")) return "inconsistency";
  if (agreements.includes("possible_variant")) return "possible_inconsistency";
  if (agreements.every((agreement) => agreement === "match")) return "match";
  return "insufficient_data";
}

function noteFor(
  fieldKey: FieldKey,
  status: ComparisonStatus,
  unparsed: number,
) {
  const label = fieldLabels[fieldKey].toLowerCase();
  let note: string;

  switch (status) {
    case "match":
      note = `All sources agree on ${label}.`;
      break;
    case "possible_inconsistency":
      note = `${fieldLabels[fieldKey]} differs slightly between the sources shown.`;
      break;
    case "inconsistency":
      note = `${fieldLabels[fieldKey]} does not match between the sources shown.`;
      break;
    case "insufficient_data":
      note = `The available values for ${label} could not be compared automatically, or only one source provides it.`;
      break;
    case "not_available":
      note = `No source provides ${label}.`;
      break;
  }

  if (unparsed > 0 && status !== "not_available") {
    note += " One or more values could not be read automatically.";
  }

  return note;
}

export function buildComparisons(input: ComparisonInput): ComparisonResult {
  const observations = [
    ...investigationObservations(input.investigation),
    ...documentObservations(input.documents),
    ...claimObservations(input.claims),
  ];

  const fields = fieldKeyValues
    .filter((fieldKey) => comparableSet.has(fieldKey))
    .map((fieldKey) => {
      const fieldObservations = observations.filter(
        (observation) => observation.fieldKey === fieldKey,
      );

      const agreements: Agreement[] = [];

      for (
        let left = 0;
        left < fieldObservations.length;
        left += 1
      ) {
        for (
          let right = left + 1;
          right < fieldObservations.length;
          right += 1
        ) {
          agreements.push(
            compareFieldValues(
              fieldKey,
              fieldObservations[left]!.normalized,
              fieldObservations[right]!.normalized,
            ),
          );
        }
      }

      const parsedAgreements = agreements.filter(
        (agreement) => agreement !== "unparsed",
      );
      const status =
        fieldObservations.length === 0
          ? "not_available"
          : fieldObservations.length === 1
            ? "insufficient_data"
            : statusFromAgreements(parsedAgreements);
      const unparsed = agreements.filter(
        (agreement) => agreement === "unparsed",
      ).length;

      return {
        fieldKey,
        label: fieldLabels[fieldKey],
        status,
        note: noteFor(fieldKey, status, unparsed),
        observations: fieldObservations,
      } satisfies ComparedField;
    });

  return {
    fields,
    byField: new Map(fields.map((field) => [field.fieldKey, field])),
  };
}

export function sourceLabelFor(
  documentType: DocumentType,
  originalName: string,
) {
  return `${documentLabel(documentType)} — ${originalName}`.slice(0, 200);
}
