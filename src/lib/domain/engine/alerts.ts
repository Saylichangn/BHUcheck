import type { AlertLevel, ProfessionalAdvice } from "@/lib/domain/alerts";
import { alertLevelOrder } from "@/lib/domain/alerts";
import { documentLabel } from "@/lib/documents/types";
import type { FieldKey } from "@/lib/domain/fields";
import type { FraudTag } from "@/lib/domain/tags";
import { intendedUseLabels } from "@/lib/investigations/types";
import { parseDate } from "../extraction/dates";
import {
  classifyLand,
  isAgriculturalClass,
} from "../extraction/land";
import { toAsciiDigits } from "../extraction/normalize";
import type {
  ComparedField,
  ComparisonDocument,
  ComparisonDocumentField,
  ComparisonInvestigation,
  ComparisonResult,
  Observation,
} from "./compare";
import { sourceLabelFor } from "./compare";
import type { EvaluatedClaim } from "./claims";

export type AlertCandidate = {
  ruleKey: string;
  title: string;
  level: AlertLevel;
  tag: FraudTag;
  explanation: string;
  evidenceDocumentId: string | null;
  evidenceFieldId: string | null;
  evidenceValue: string | null;
  sourceLabel: string;
  documentDate: Date | null;
  whyItMatters: string;
  nextStep: string;
  professionalAdvice: ProfessionalAdvice;
};

export type AlertInput = {
  investigation: ComparisonInvestigation;
  documents: ComparisonDocument[];
  claims: EvaluatedClaim[];
  comparison: ComparisonResult;
  now?: Date;
};

type Evidence = {
  evidenceDocumentId: string | null;
  evidenceFieldId: string | null;
  evidenceValue: string | null;
  sourceLabel: string;
  documentDate: Date | null;
};

type Guidance = {
  why: string;
  next: string;
  advice: ProfessionalAdvice;
};

function truncate(value: string, length: number) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}

function documentById(
  documents: ComparisonDocument[],
  id: string | null,
): ComparisonDocument | undefined {
  return id ? documents.find((document) => document.id === id) : undefined;
}

function dateFieldOf(document: ComparisonDocument) {
  return document.fields.find((field) => field.fieldKey === "document_date");
}

function dateOfDocument(document: ComparisonDocument): Date | null {
  const field = dateFieldOf(document);

  if (!field) return null;

  const parsed = parseDate(field.value);

  return parsed ? new Date(`${parsed.iso}T00:00:00Z`) : null;
}

function evidenceForField(
  document: ComparisonDocument,
  field: ComparisonDocumentField,
): Evidence {
  return {
    evidenceDocumentId: document.id,
    evidenceFieldId: field.id,
    evidenceValue: field.value,
    sourceLabel: sourceLabelFor(document.type, document.originalName),
    documentDate: dateOfDocument(document),
  };
}

function evidenceForObservation(
  observation: Observation | undefined,
  documents: ComparisonDocument[],
): Evidence {
  if (!observation) {
    return {
      evidenceDocumentId: null,
      evidenceFieldId: null,
      evidenceValue: null,
      sourceLabel: "Comparison table",
      documentDate: null,
    };
  }

  const document = documentById(documents, observation.documentId);

  return {
    evidenceDocumentId: observation.documentId,
    evidenceFieldId: observation.fieldId,
    evidenceValue: observation.value,
    sourceLabel: document
      ? sourceLabelFor(document.type, document.originalName)
      : observation.sourceLabel,
    documentDate: document ? dateOfDocument(document) : null,
  };
}

function allFields(
  documents: ComparisonDocument[],
  fieldKey: FieldKey,
): Array<{ document: ComparisonDocument; field: ComparisonDocumentField }> {
  return documents.flatMap((document) =>
    document.fields
      .filter((field) => field.fieldKey === fieldKey)
      .map((field) => ({ document, field })),
  );
}

function isNoneEntry(value: string) {
  return /^(?:काही\s*नाही|नाही|none|nil|no\s+rights?|not\s+applicable)[.\s]*$/i.test(
    toAsciiDigits(value).trim(),
  );
}

const fieldTags: Partial<Record<FieldKey, FraudTag>> = {
  owner_name: "ownership_mismatch",
  survey_no: "ownership_mismatch",
  village: "ownership_mismatch",
  taluka: "ownership_mismatch",
  district: "ownership_mismatch",
  area: "encroachment_boundary",
  land_class: "agricultural_land_without_na",
  registration_no: "fake_registration",
};

const fieldGuidance: Partial<Record<FieldKey, Guidance>> = {
  owner_name: {
    why: "The name on the record determines who can transfer the land.",
    next: "Ask the seller to explain the difference and check the name with the registration office.",
    advice: "lawyer",
  },
  survey_no: {
    why: "A different survey or gat number can mean a different parcel of land.",
    next: "Compare the parcel on the 7/12 and the sale deed, and ask the Talathi to confirm the number.",
    advice: "lawyer",
  },
  village: {
    why: "A different village can mean a different property.",
    next: "Check the village on the record and on the sale deed, and ask the Talathi to confirm it.",
    advice: "lawyer",
  },
  taluka: {
    why: "A different taluka can mean a different property.",
    next: "Check the taluka on the record and on the sale deed, and ask the Talathi to confirm it.",
    advice: "lawyer",
  },
  district: {
    why: "A different district can mean a different property.",
    next: "Check the district on the record and on the sale deed, and ask the registration office to confirm it.",
    advice: "lawyer",
  },
  area: {
    why: "An area difference can affect the price, the boundaries or the share transferred.",
    next: "Ask a surveyor to measure the parcel and compare the measurement with the record.",
    advice: "surveyor",
  },
  land_class: {
    why: "The land classification affects what the land may be used for and how it is valued.",
    next: "Check the classification with the Talathi and ask for the NA order, if any.",
    advice: "lawyer",
  },
  registration_no: {
    why: "A different registration number can point to a different registered document.",
    next: "Search the registration office records and compare the document number.",
    advice: "lawyer",
  },
};

const defaultGuidance: Guidance = {
  why: "A difference between the uploaded copies should be explained before any payment or registration.",
  next: "Ask the seller for an explanation and check the value with the issuing authority.",
  advice: "lawyer",
};

function guidanceFor(fieldKey: FieldKey) {
  return fieldGuidance[fieldKey] ?? defaultGuidance;
}

function comparisonAlert(
  field: ComparedField,
  documents: ComparisonDocument[],
): AlertCandidate | null {
  if (field.status !== "inconsistency" && field.status !== "possible_inconsistency") {
    return null;
  }

  const observation =
    field.observations.find(
      (entry) => entry.documentId !== null && entry.fieldId !== null,
    ) ?? field.observations[0];
  const evidence = evidenceForObservation(observation, documents);
  const guidance = guidanceFor(field.fieldKey);
  const shown = field.observations
    .slice(0, 3)
    .map(
      (entry) => `"${truncate(entry.value, 80)}" (${entry.sourceLabel})`,
    )
    .join("; ");
  const hard = field.status === "inconsistency";

  return {
    ruleKey: `${field.fieldKey}_${hard ? "mismatch" : "variation"}`.slice(0, 40),
    title: truncate(
      hard
        ? `${field.label} differs between the uploaded sources`
        : `${field.label} is close but not identical`,
      200,
    ),
    level: hard ? "high" : "review",
    tag: fieldTags[field.fieldKey] ?? "document_authenticity",
    explanation: `${field.note} Values shown: ${shown}. Potential inconsistency. Confirm with the issuing authority.`,
    ...evidence,
    whyItMatters: guidance.why,
    nextStep: guidance.next,
    professionalAdvice: guidance.advice,
  };
}

function comparisonChecked(
  field: ComparedField,
  documents: ComparisonDocument[],
): AlertCandidate | null {
  if (field.status !== "match") return null;

  const observation =
    field.observations.find(
      (entry) => entry.documentId !== null && entry.fieldId !== null,
    ) ?? field.observations[0];
  const evidence = evidenceForObservation(observation, documents);

  return {
    ruleKey: `${field.fieldKey}_consistent`.slice(0, 40),
    title: truncate(
      `${field.label} matches across the uploaded sources`,
      200,
    ),
    level: "checked",
    tag: fieldTags[field.fieldKey] ?? "document_authenticity",
    explanation: `${field.note} This compares only the uploaded copies.`,
    ...evidence,
    whyItMatters:
      "Agreement between uploaded copies is a useful first check, but it does not confirm the record held by the issuing authority.",
    nextStep:
      "No action is indicated by this comparison. The record at the issuing authority still controls.",
    professionalAdvice: "none",
  };
}

function rightsAlerts(documents: ComparisonDocument[]): AlertCandidate[] {
  const alerts: AlertCandidate[] = [];

  for (const { document, field } of allFields(documents, "other_rights")) {
    if (isNoneEntry(field.value)) continue;

    const value = toAsciiDigits(field.value);

    if (/mortgage|hypothecat|charge|loan|बँक|bank|कर्ज|तारण|गहाण|बोजा/i.test(value)) {
      alerts.push({
        ruleKey: "mortgage_entry",
        title: "Other-rights entry mentions a mortgage or charge",
        level: "critical",
        tag: "hidden_mortgage",
        explanation: `The uploaded ${documentLabel(
          document.type,
        )} records "${truncate(field.value, 200)}" under other rights.`,
        ...evidenceForField(document, field),
        whyItMatters:
          "A mortgage or charge can affect a transfer unless it is discharged.",
        nextStep:
          "Ask for the discharge or no-dues document and confirm the entry with the registration office or the lender.",
        professionalAdvice: "lawyer",
      });
    }

    if (/tenan|lease|भाडे|कुळ/i.test(value)) {
      alerts.push({
        ruleKey: "tenancy_entry",
        title: "Other-rights entry mentions tenancy or a lease",
        level: "review",
        tag: "tenancy_other_rights",
        explanation: `The uploaded ${documentLabel(
          document.type,
        )} records "${truncate(field.value, 200)}" under other rights.`,
        ...evidenceForField(document, field),
        whyItMatters:
          "Tenancy or lease rights can limit possession or transfer.",
        nextStep:
          "Ask the seller for the lease or tenancy documents and have a lawyer review them.",
        professionalAdvice: "lawyer",
      });
    }

    if (/court|injunction|न्यायालय|खटला|स्थगिती|दावा/i.test(value)) {
      alerts.push({
        ruleKey: "court_entry",
        title: "Other-rights entry mentions a court case or restriction",
        level: "high",
        tag: "court_case",
        explanation: `The uploaded ${documentLabel(
          document.type,
        )} records "${truncate(field.value, 200)}" under other rights.`,
        ...evidenceForField(document, field),
        whyItMatters:
          "A pending case or injunction can affect whether the land can be transferred.",
        nextStep:
          "Check the case status on eCourts and ask a lawyer to review the order.",
        professionalAdvice: "lawyer",
      });
    }
  }

  return alerts;
}

function landAlerts(input: AlertInput): AlertCandidate[] {
  const alerts: AlertCandidate[] = [];
  const landEntries = allFields(input.documents, "land_class");
  const stateLand = landEntries.find(({ field }) => {
    const landClass = classifyLand(field.value);
    return landClass === "forest" || landClass === "government";
  });

  if (stateLand) {
    alerts.push({
      ruleKey: "government_or_forest_land",
      title: "Land is recorded as forest or government land",
      level: "high",
      tag: "government_forest_land",
      explanation: `The uploaded ${documentLabel(
        stateLand.document.type,
      )} records the land classification as "${truncate(
        stateLand.field.value,
        200,
      )}".`,
      ...evidenceForField(stateLand.document, stateLand.field),
      whyItMatters:
        "Government or forest land is generally not available for a private sale.",
      nextStep:
        "Check the classification with the Talathi and the Forest Department before proceeding.",
      professionalAdvice: "both",
    });
  }

  const agricultural = landEntries.find(({ field }) =>
    isAgriculturalClass(classifyLand(field.value)),
  );

  if (!agricultural) return alerts;

  if (input.investigation.intendedUse === "agricultural") {
    alerts.push({
      ruleKey: "agricultural_use_consistent",
      title: "Recorded land use and intended use are both agricultural",
      level: "checked",
      tag: "agricultural_land_without_na",
      explanation:
        "The uploaded record shows agricultural land and the investigation states an agricultural intended use.",
      ...evidenceForField(agricultural.document, agricultural.field),
      whyItMatters:
        "An agricultural classification does not by itself rule out a conversion requirement for a different use.",
      nextStep:
        "No action is indicated by this check for the stated use. Confirm the classification with the Talathi.",
      professionalAdvice: "none",
    });

    return alerts;
  }

  const naDocument = input.documents.find(
    (document) => document.type === "na_order",
  );
  const evidence = evidenceForField(agricultural.document, agricultural.field);

  if (naDocument) {
    const naDate = dateFieldOf(naDocument);

    alerts.push({
      ruleKey: "na_order_uploaded",
      title: "Non-agricultural order uploaded for agricultural land",
      level: "checked",
      tag: "agricultural_land_without_na",
      explanation:
        "The uploaded record shows agricultural land and an NA order is among the uploaded documents.",
      evidenceDocumentId: naDocument.id,
      evidenceFieldId: naDate?.id ?? null,
      evidenceValue: naDate?.value ?? null,
      sourceLabel: sourceLabelFor(naDocument.type, naDocument.originalName),
      documentDate: dateOfDocument(naDocument),
      whyItMatters:
        "The order is relevant if the land is to be used for a non-agricultural purpose.",
      nextStep:
        "Check that the order covers the same survey number and area with the issuing authority.",
      professionalAdvice: "none",
    });

    return alerts;
  }

  alerts.push({
    ruleKey: "agricultural_without_na",
    title: "Agricultural land recorded without an uploaded NA order",
    level: "high",
    tag: "agricultural_land_without_na",
    explanation: `The uploaded ${documentLabel(
      agricultural.document.type,
    )} records the land as "${truncate(
      agricultural.field.value,
      120,
    )}". The investigation states an intended use of ${intendedUseLabels[
      input.investigation.intendedUse
    ].toLowerCase()}, and no NA order is among the uploaded documents. Potential inconsistency. Confirm with the issuing authority.`,
    ...evidence,
    whyItMatters:
      "Agricultural land may need conversion before it can be used for a non-agricultural purpose.",
    nextStep:
      "Ask the seller for the NA order and confirm it with the district or planning authority.",
    professionalAdvice: "lawyer",
  });

  return alerts;
}

function powerOfAttorneyAlerts(documents: ComparisonDocument[]): AlertCandidate[] {
  return documents
    .filter((document) => document.type === "power_of_attorney")
    .map((document) => {
      const registration = document.fields.find(
        (field) =>
          field.fieldKey === "registration_no" && field.value.trim().length > 0,
      );
      const dateField = dateFieldOf(document);

      if (registration) {
        return {
          ruleKey: "poa_registered",
          title: "Registration number found on the power of attorney",
          level: "checked" as const,
          tag: "poa_misuse" as const,
          explanation:
            "A registration number was read from the uploaded power of attorney.",
          ...evidenceForField(document, registration),
          whyItMatters:
            "A power of attorney used for a property transaction should be registered and should cover the specific act.",
          nextStep:
            "No action is indicated by this check. Check the scope of the power with a lawyer.",
          professionalAdvice: "none" as const,
        };
      }

      return {
        ruleKey: "poa_without_registration",
        title: "No registration number read from the power of attorney",
        level: "review" as const,
        tag: "poa_misuse" as const,
        explanation:
          "The uploaded power of attorney does not show a registration number in the text that could be read.",
        evidenceDocumentId: document.id,
        evidenceFieldId: dateField?.id ?? null,
        evidenceValue: dateField?.value ?? null,
        sourceLabel: sourceLabelFor(document.type, document.originalName),
        documentDate: dateOfDocument(document),
        whyItMatters:
          "A power of attorney used for a sale should be registered and must authorise the specific transaction.",
        nextStep:
          "Ask for the registered power of attorney and have a lawyer check its scope and validity.",
        professionalAdvice: "lawyer" as const,
      };
    });
}

function saleDeedAlerts(documents: ComparisonDocument[]): AlertCandidate[] {
  const alerts: AlertCandidate[] = [];

  for (const document of documents) {
    if (document.type !== "sale_deed") continue;

    const registration = document.fields.find(
      (field) =>
        field.fieldKey === "registration_no" && field.value.trim().length > 0,
    );
    const dateField = dateFieldOf(document);

    if (registration) {
      alerts.push({
        ruleKey: "sale_deed_registered",
        title: "Registration number found on the sale deed",
        level: "checked",
        tag: "document_authenticity",
        explanation:
          "A registration number was read from the uploaded sale deed.",
        ...evidenceForField(document, registration),
        whyItMatters:
          "The registration number is how the registered copy can be traced at the registration office.",
        nextStep:
          "No action is indicated by this check. Compare the number with the Index II before registration.",
        professionalAdvice: "none",
      });
    } else {
      alerts.push({
        ruleKey: "sale_deed_without_registration",
        title: "No registration number read from the sale deed",
        level: "review",
        tag: "document_authenticity",
        explanation:
          "The uploaded sale deed does not show a registration number in the text that could be read.",
        evidenceDocumentId: document.id,
        evidenceFieldId: dateField?.id ?? null,
        evidenceValue: dateField?.value ?? null,
        sourceLabel: sourceLabelFor(document.type, document.originalName),
        documentDate: dateOfDocument(document),
        whyItMatters:
          "Without a registration number, the transfer may not have been registered.",
        nextStep:
          "Ask for the registered sale deed or the Index II from the registration office.",
        professionalAdvice: "lawyer",
      });
    }

    if (!dateField) {
      alerts.push({
        ruleKey: "sale_deed_without_date",
        title: "No date read from the sale deed",
        level: "review",
        tag: "document_authenticity",
        explanation:
          "The uploaded sale deed does not show an execution date in the text that could be read.",
        evidenceDocumentId: document.id,
        evidenceFieldId: null,
        evidenceValue: null,
        sourceLabel: sourceLabelFor(document.type, document.originalName),
        documentDate: null,
        whyItMatters:
          "The execution date affects priority and the mutation sequence.",
        nextStep:
          "Check the date on the original deed and on the registered copy.",
        professionalAdvice: "lawyer",
      });
    }
  }

  return alerts;
}

function extractAlerts(
  documents: ComparisonDocument[],
  now: Date,
): AlertCandidate[] {
  const extracts = documents.filter((document) => document.type === "7_12");
  const dated = extracts.flatMap((document) => {
    const field = dateFieldOf(document);
    const parsed = field ? parseDate(field.value) : null;

    return field && parsed
      ? [{ document, field, iso: parsed.iso }]
      : [];
  });

  if (dated.length === 0) return [];

  dated.sort((left, right) => right.iso.localeCompare(left.iso));
  const latest = dated[0]!;
  const ageCutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12, now.getUTCDate()),
  );
  const latestDate = new Date(`${latest.iso}T00:00:00Z`);
  const stale = latestDate.getTime() < ageCutoff.getTime();
  const evidence = evidenceForField(latest.document, latest.field);

  return [
    {
      ruleKey: stale ? "stale_712" : "fresh_712",
      title: stale
        ? "7/12 extract is more than 12 months old"
        : "7/12 extract is dated within the last 12 months",
      level: stale ? "review" : "checked",
      tag: "mutation_not_updated",
      explanation: stale
        ? `The latest uploaded 7/12 is dated ${latest.iso}. Land records change, so an old extract may not show later entries.`
        : `The latest uploaded 7/12 is dated ${latest.iso}.`,
      ...evidence,
      whyItMatters:
        "The 7/12 records the current holder and any entries under other rights.",
      nextStep: stale
        ? "Download a current 7/12 from Mahabhulekh and upload it."
        : "No action is indicated by this check. A current extract still controls at the time of registration.",
      professionalAdvice: "none",
    },
  ];
}

function mutationAlerts(documents: ComparisonDocument[]): AlertCandidate[] {
  const saleDates = documents
    .filter((document) => document.type === "sale_deed")
    .flatMap((document) => {
      const field = dateFieldOf(document);
      const parsed = field ? parseDate(field.value) : null;
      return field && parsed ? [{ document, field, iso: parsed.iso }] : [];
    })
    .sort((left, right) => right.iso.localeCompare(left.iso));

  const mutationDates = documents
    .filter((document) => document.type === "mutation_entry")
    .flatMap((document) => {
      const field = dateFieldOf(document);
      const parsed = field ? parseDate(field.value) : null;
      return field && parsed ? [{ document, field, iso: parsed.iso }] : [];
    })
    .sort((left, right) => right.iso.localeCompare(left.iso));

  const sale = saleDates[0];
  const mutation = mutationDates[0];

  if (!sale || !mutation) return [];

  const updated = mutation.iso >= sale.iso;

  return [
    {
      ruleKey: updated ? "mutation_after_sale" : "mutation_before_sale",
      title: updated
        ? "Mutation entry is dated after the sale deed"
        : "Mutation entry is older than the sale deed",
      level: updated ? "checked" : "review",
      tag: "mutation_not_updated",
      explanation: `The latest uploaded sale deed is dated ${sale.iso} and the latest mutation entry is dated ${mutation.iso}.`,
      ...evidenceForField(mutation.document, mutation.field),
      whyItMatters:
        "The mutation entry shows whether the land record has been updated after the transfer.",
      nextStep: updated
        ? "No action is indicated by this check. Confirm the entry on the current 7/12."
        : "Check whether a mutation entry was made after the sale and upload it.",
      professionalAdvice: updated ? "none" : "lawyer",
    },
  ];
}

function claimAlerts(
  claims: EvaluatedClaim[],
  documents: ComparisonDocument[],
): AlertCandidate[] {
  return claims.flatMap((claim): AlertCandidate[] => {
    const document = documentById(documents, claim.evidenceDocumentId);
    const evidence = document
      ? {
          evidenceDocumentId: document.id,
          evidenceFieldId: claim.evidenceFieldId,
          evidenceValue: claim.text,
          sourceLabel: sourceLabelFor(document.type, document.originalName),
          documentDate: dateOfDocument(document),
        }
      : {
          evidenceDocumentId: null,
          evidenceFieldId: null,
          evidenceValue: claim.text,
          sourceLabel: "Seller statement",
          documentDate: null,
        };
    const tag = claim.fieldKey
      ? (fieldTags[claim.fieldKey] ?? "document_authenticity")
      : "document_authenticity";

    if (claim.status === "contradicted") {
      return [
        {
          ruleKey: "claim_contradiction",
          title: "Seller statement conflicts with an uploaded document",
          level: "high" as const,
          tag,
          explanation: `The seller's statement says: "${truncate(
            claim.text,
            240,
          )}". ${claim.rationale} Potential inconsistency. Confirm with the issuing authority.`,
          ...evidence,
          whyItMatters:
            "A statement that differs from the documents should be explained before any payment or registration.",
          nextStep:
            "Ask the seller to explain the difference in writing and check the value with the issuing authority.",
          professionalAdvice: "lawyer" as const,
        },
      ];
    }

    if (claim.status === "supported") {
      return [
        {
          ruleKey: "claim_supported",
          title: "Seller statement is supported by an uploaded document",
          level: "checked" as const,
          tag,
          explanation: claim.rationale,
          ...evidence,
          whyItMatters:
            "A statement that matches a document is a useful first check.",
          nextStep:
            "No action is indicated by this check. The record at the issuing authority still controls.",
          professionalAdvice: "none" as const,
        },
      ];
    }

    return [];
  });
}

function noMortgageChecked(
  documents: ComparisonDocument[],
  existing: AlertCandidate[],
): AlertCandidate[] {
  if (existing.some((alert) => alert.ruleKey === "mortgage_entry")) return [];

  for (const document of documents) {
    if (document.type !== "7_12") continue;

    const entry = document.fields.find(
      (field) =>
        field.fieldKey === "other_rights" && isNoneEntry(field.value),
    );

    if (!entry) continue;

    return [
      {
        ruleKey: "no_rights_entry",
        title: "No other-rights entry found in the 7/12",
        level: "checked",
        tag: "hidden_mortgage",
        explanation:
          "The uploaded 7/12 shows no entry under other rights. This covers only the text of the uploaded copy.",
        ...evidenceForField(document, entry),
        whyItMatters:
          "The other-rights column can record mortgages, charges and similar entries.",
        nextStep:
          "No action is indicated by this entry. Check the current record before registration.",
        professionalAdvice: "none",
      },
    ];
  }

  return [];
}

export function buildAlerts(input: AlertInput): AlertCandidate[] {
  const now = input.now ?? new Date();
  const comparisonAlerts = input.comparison.fields.flatMap((field) => {
    const alert = comparisonAlert(field, input.documents);
    return alert ? [alert] : [];
  });
  const comparisonChecks = input.comparison.fields.flatMap((field) => {
    const alert = comparisonChecked(field, input.documents);
    return alert ? [alert] : [];
  });
  const rights = rightsAlerts(input.documents);
  const alerts = [
    ...comparisonAlerts,
    ...comparisonChecks,
    ...rights,
    ...landAlerts(input),
    ...powerOfAttorneyAlerts(input.documents),
    ...saleDeedAlerts(input.documents),
    ...extractAlerts(input.documents, now),
    ...mutationAlerts(input.documents),
    ...claimAlerts(input.claims, input.documents),
    ...noMortgageChecked(input.documents, rights),
  ];

  const seen = new Set<string>();

  return alerts
    .filter((alert) => {
      const key = `${alert.ruleKey}|${alert.evidenceDocumentId ?? ""}|${alert.title}`;

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (left, right) =>
        alertLevelOrder[left.level] - alertLevelOrder[right.level] ||
        left.title.localeCompare(right.title),
    );
}
