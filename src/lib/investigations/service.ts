import type { AlertLevel, ProfessionalAdvice } from "@/lib/domain/alerts";
import { alertLevelOrder } from "@/lib/domain/alerts";
import {
  describeAlertRules,
  type RuleStatusItem,
} from "@/lib/domain/engine/rule-status";
import type { ClaimStatus } from "@/lib/domain/claims";
import type { ComparisonStatus } from "@/lib/domain/engine/compare";
import {
  comparableFieldKeys,
  fieldLabels,
  isFieldKey,
  type FieldKey,
} from "@/lib/domain/fields";
import type { ChecklistStatus } from "@/lib/domain/checklist";
import type { IntendedUse, PropertyType } from "@/lib/investigations/types";
import { prisma } from "@/lib/db";

export type AlertView = {
  id: string;
  level: AlertLevel;
  tag: string;
  title: string;
  explanation: string;
  whyItMatters: string;
  nextStep: string;
  professionalAdvice: ProfessionalAdvice;
  sourceLabel: string;
  evidenceValue: string | null;
  evidenceDocumentId: string | null;
  documentDate: Date | null;
  checkedAt: Date;
  ruleKey: string;
  source: string;
  claimId: string | null;
  resolved: boolean;
  reviewedAt: Date | null;
};

export type RuleStatusView = RuleStatusItem;

export type ClaimView = {
  id: string;
  text: string;
  fieldKey: string | null;
  claimedValue: string | null;
  claimedUnit: string | null;
  status: ClaimStatus;
  rationale: string | null;
  aiAnswer: string | null;
  evidenceDocumentId: string | null;
  createdAt: Date;
};

export type ChecklistView = {
  id: string;
  key: string;
  label: string;
  authority: string;
  groupLabel: string;
  requirement: string;
  guidanceOnly: boolean;
  tags: string[];
  status: ChecklistStatus;
  note: string | null;
  sourceSlug: string | null;
  satisfiedByDocumentId: string | null;
  sortOrder: number;
};

export type ComparisonObservationView = {
  id: string;
  sourceType: string;
  sourceId: string | null;
  value: string | null;
  normalizedValue: string | null;
  unit: string | null;
  sourceLabel: string;
};

export type ComparisonFieldView = {
  fieldKey: FieldKey;
  label: string;
  status: ComparisonStatus;
  note: string | null;
  observations: ComparisonObservationView[];
};

export type InvestigationSummary = {
  id: string;
  nickname: string;
  district: string;
  taluka: string | null;
  village: string | null;
  surveyNo: string | null;
  intendedUse: IntendedUse;
  updatedAt: Date;
  documentCount: number;
  criticalCount: number;
  highCount: number;
  reviewCount: number;
};

export type InvestigationDetail = {
  id: string;
  nickname: string;
  state: string;
  district: string;
  taluka: string | null;
  village: string | null;
  surveyNo: string | null;
  intendedUse: IntendedUse;
  propertyType: PropertyType;
  createdAt: Date;
  updatedAt: Date;
  documents: Array<{
    id: string;
    type: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    pageCount: number | null;
    extractionStatus: string;
    extractionNote: string | null;
    uploadedAt: Date;
    fields: Array<{
      id: string;
      fieldKey: string;
      ordinal: number;
      value: string;
      unit: string | null;
      sourceText: string | null;
      userCorrected: boolean;
    }>;
  }>;
  claims: ClaimView[];
  alerts: AlertView[];
  checklist: ChecklistView[];
  checklistReviews: Array<{
    requirementKey: string;
    checked: boolean;
  }>;
  ruleStatus: RuleStatusView[];
  comparisons: ComparisonFieldView[];
  questionAnswers: Array<{
    questionKey: string;
    status: string;
    note: string | null;
    sourcesJson: string | null;
    aiSummary: string | null;
    lookupAt: Date | null;
  }>;
  reports: Array<{
    id: string;
    version: number;
    fileName: string;
    sizeBytes: number;
    generatedAt: Date;
  }>;
};

export async function listInvestigations(
  userId: string,
): Promise<InvestigationSummary[]> {
  const rows = await prisma.investigation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { documents: true } },
      alerts: { select: { level: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    nickname: row.nickname,
    district: row.district,
    taluka: row.taluka,
    village: row.village,
    surveyNo: row.surveyNo,
    intendedUse: row.intendedUse as IntendedUse,
    updatedAt: row.updatedAt,
    documentCount: row._count.documents,
    criticalCount: row.alerts.filter((alert) => alert.level === "critical")
      .length,
    highCount: row.alerts.filter((alert) => alert.level === "high").length,
    reviewCount: row.alerts.filter((alert) => alert.level === "review").length,
  }));
}

function buildComparisonViews(
  rows: Array<{
    id: string;
    fieldKey: string;
    sourceType: string;
    sourceId: string | null;
    value: string | null;
    normalizedValue: string | null;
    unit: string | null;
    status: string;
    note: string | null;
  }>,
): ComparisonFieldView[] {
  const byField = new Map<
    string,
    {
      status: string;
      note: string | null;
      observations: ComparisonObservationView[];
    }
  >();

  for (const row of rows) {
    const entry = byField.get(row.fieldKey) ?? {
      status: "not_available",
      note: null,
      observations: [],
    };

    if (row.sourceType === "summary") {
      entry.status = row.status;
      entry.note = row.note;
    } else {
      entry.observations.push({
        id: row.id,
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        value: row.value,
        normalizedValue: row.normalizedValue,
        unit: row.unit,
        sourceLabel: row.note ?? "Source",
      });
    }

    byField.set(row.fieldKey, entry);
  }

  return comparableFieldKeys.flatMap((fieldKey) => {
    const entry = byField.get(fieldKey);

    if (!entry) return [];

    return [
      {
        fieldKey,
        label: fieldLabels[fieldKey],
        status: entry.status as ComparisonStatus,
        note: entry.note,
        observations: entry.observations,
      },
    ];
  });
}

export async function getInvestigationDetail(
  userId: string,
  investigationId: string,
): Promise<InvestigationDetail | null> {
  const investigation = await prisma.investigation.findFirst({
    where: { id: investigationId, userId },
    include: {
      documents: {
        orderBy: { uploadedAt: "desc" },
        include: {
          fields: {
            orderBy: [{ fieldKey: "asc" }, { ordinal: "asc" }],
          },
        },
      },
      claims: { orderBy: { createdAt: "desc" } },
      alerts: true,
      checklist: { orderBy: { sortOrder: "asc" } },
      checklistReviews: true,
      comparisons: { orderBy: [{ fieldKey: "asc" }, { sourceType: "asc" }] },
      questionAnswers: true,
      reports: {
        orderBy: { generatedAt: "desc" },
        select: {
          id: true,
          version: true,
          fileName: true,
          sizeBytes: true,
          generatedAt: true,
        },
      },
    },
  });

  if (!investigation) return null;

  const alerts: AlertView[] = investigation.alerts
    .map((alert) => ({
      id: alert.id,
      level: alert.level as AlertLevel,
      tag: alert.tag,
      title: alert.title,
      explanation: alert.explanation,
      whyItMatters: alert.whyItMatters,
      nextStep: alert.nextStep,
      professionalAdvice: alert.professionalAdvice as ProfessionalAdvice,
      sourceLabel: alert.sourceLabel,
      evidenceValue: alert.evidenceValue,
      evidenceDocumentId: alert.evidenceDocumentId,
      documentDate: alert.documentDate,
      checkedAt: alert.checkedAt,
      ruleKey: alert.ruleKey,
      source: alert.source,
      claimId: alert.claimId,
      resolved: alert.resolved,
      reviewedAt: alert.reviewedAt,
    }))
    .sort(
      (left, right) =>
        alertLevelOrder[left.level] - alertLevelOrder[right.level] ||
        left.title.localeCompare(right.title),
    );

  const comparisons = buildComparisonViews(investigation.comparisons);

  return {
    ...investigation,
    intendedUse: investigation.intendedUse as IntendedUse,
    propertyType: investigation.propertyType as PropertyType,
    alerts,
    claims: investigation.claims.map((claim) => ({
      id: claim.id,
      text: claim.text,
      fieldKey: claim.fieldKey,
      claimedValue: claim.claimedValue,
      claimedUnit: claim.claimedUnit,
      status: claim.status as ClaimStatus,
      rationale: claim.rationale,
      aiAnswer: claim.aiAnswer,
      evidenceDocumentId: claim.evidenceDocumentId,
      createdAt: claim.createdAt,
    })),
    checklist: investigation.checklist.map((item) => ({
      ...item,
      status: item.status as ChecklistStatus,
    })),
    comparisons,
    ruleStatus: describeAlertRules({
      documents: investigation.documents.map((document) => ({
        type: document.type,
      })),
      claims: investigation.claims.map((claim) => ({ id: claim.id })),
      comparisons: comparisons.map((field) => ({
        fieldKey: field.fieldKey,
        observations: field.observations.map((observation) => ({
          sourceId: observation.sourceId,
          sourceType: observation.sourceType,
        })),
      })),
      intendedUse: investigation.intendedUse,
    }),
  };
}

export type InvestigationFormValues = {
  id: string;
  nickname: string;
  district: string;
  taluka: string | null;
  village: string | null;
  surveyNo: string | null;
  intendedUse: IntendedUse;
  propertyType: PropertyType;
};

export async function getInvestigationForForm(
  userId: string,
  investigationId: string,
): Promise<InvestigationFormValues | null> {
  const investigation = await prisma.investigation.findFirst({
    where: { id: investigationId, userId },
    select: {
      id: true,
      nickname: true,
      district: true,
      taluka: true,
      village: true,
      surveyNo: true,
      intendedUse: true,
      propertyType: true,
    },
  });

  if (!investigation) return null;

  return {
    ...investigation,
    intendedUse: investigation.intendedUse as IntendedUse,
    propertyType: investigation.propertyType as PropertyType,
  };
}

export async function investigationExists(
  userId: string,
  investigationId: string,
) {
  const count = await prisma.investigation.count({
    where: { id: investigationId, userId },
  });

  return count > 0;
}

export async function documentBelongsToUser(
  userId: string,
  documentId: string,
) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      investigation: { userId },
    },
    select: {
      id: true,
      investigationId: true,
      originalName: true,
      mimeType: true,
      storagePath: true,
      sizeBytes: true,
    },
  });
}

export function fieldLabel(fieldKey: string) {
  return isFieldKey(fieldKey) ? fieldLabels[fieldKey] : fieldKey;
}
