import { isDocumentType, type DocumentType } from "@/lib/documents/types";
import { buildAlerts } from "@/lib/domain/engine/alerts";
import { evaluateClaims } from "@/lib/domain/engine/claims";
import { buildChecklist } from "@/lib/domain/engine/checklist";
import {
  buildComparisons,
  type ComparisonInput,
} from "@/lib/domain/engine/compare";
import { isFieldKey, type FieldKey } from "@/lib/domain/fields";
import type { IntendedUse } from "@/lib/investigations/types";
import {
  intendedUseValues,
  propertyTypeValues,
  type PropertyType,
} from "@/lib/investigations/types";
import { prisma } from "@/lib/db";

export type RefreshSummary = {
  comparisons: number;
  alerts: number;
  checklist: number;
  claims: number;
};

function asIntendedUse(value: string): IntendedUse {
  return (intendedUseValues as readonly string[]).includes(value)
    ? (value as IntendedUse)
    : "other";
}

function asDocumentType(value: string): DocumentType {
  return isDocumentType(value) ? value : "other";
}

function asFieldKey(value: string): FieldKey | null {
  return isFieldKey(value) ? value : null;
}

function asPropertyType(value: string): PropertyType {
  return (propertyTypeValues as readonly string[]).includes(value)
    ? (value as PropertyType)
    : "plot";
}

export async function refreshInvestigation(
  investigationId: string,
): Promise<RefreshSummary> {
  return prisma.$transaction(
    async (tx) => {
      const investigation = await tx.investigation.findUnique({
        where: { id: investigationId },
        include: {
          documents: {
            orderBy: { uploadedAt: "asc" },
            include: {
              fields: { orderBy: [{ fieldKey: "asc" }, { ordinal: "asc" }] },
            },
          },
          claims: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!investigation) {
        throw new Error("Investigation not found.");
      }

      const input: ComparisonInput = {
        investigation: {
          surveyNo: investigation.surveyNo,
          village: investigation.village,
          taluka: investigation.taluka,
          district: investigation.district,
          intendedUse: asIntendedUse(investigation.intendedUse),
        },
        documents: investigation.documents.map((document) => ({
          id: document.id,
          type: asDocumentType(document.type),
          originalName: document.originalName,
          uploadedAt: document.uploadedAt,
          fields: document.fields.flatMap((field) => {
            const fieldKey = asFieldKey(field.fieldKey);

            return fieldKey
              ? [
                  {
                    id: field.id,
                    fieldKey,
                    ordinal: field.ordinal,
                    value: field.value,
                    unit: field.unit,
                    sourceText: field.sourceText,
                  },
                ]
              : [];
          }),
        })),
        claims: investigation.claims.map((claim) => ({
          id: claim.id,
          text: claim.text,
          fieldKey: claim.fieldKey,
          claimedValue: claim.claimedValue,
          claimedUnit: claim.claimedUnit,
        })),
      };

      const comparison = buildComparisons(input);
      const evaluatedClaims = evaluateClaims(input, comparison);
      const alerts = buildAlerts({
        investigation: input.investigation,
        documents: input.documents,
        claims: evaluatedClaims,
        comparison,
      });
      const checklist = buildChecklist({
        investigation: {
          district: investigation.district,
          surveyNo: investigation.surveyNo,
          intendedUse: input.investigation.intendedUse,
          propertyType: asPropertyType(investigation.propertyType),
        },
        documents: input.documents,
      });

      await tx.comparison.deleteMany({ where: { investigationId } });
      await tx.alert.deleteMany({
        where: { investigationId, source: "rule" },
      });
      await tx.checklistItem.deleteMany({ where: { investigationId } });

      for (const claim of evaluatedClaims) {
        await tx.claim.update({
          where: { id: claim.id },
          data: {
            status: claim.status,
            rationale: claim.rationale,
            evidenceDocumentId: claim.evidenceDocumentId,
            evidenceFieldId: claim.evidenceFieldId,
          },
        });
      }

      const comparisonRows = comparison.fields.flatMap((field) => [
        {
          investigationId,
          fieldKey: field.fieldKey,
          sourceType: "summary",
          sourceId: null,
          value: null,
          normalizedValue: null,
          unit: null,
          status: field.status,
          note: field.note,
        },
        ...field.observations.map((observation) => ({
          investigationId,
          fieldKey: field.fieldKey,
          sourceType: observation.sourceType,
          sourceId: observation.sourceId,
          value: observation.value,
          normalizedValue: observation.normalized.normalized,
          unit: observation.normalized.unit,
          status: "observed",
          note: observation.sourceLabel,
        })),
      ]);

      if (comparisonRows.length > 0) {
        await tx.comparison.createMany({ data: comparisonRows });
      }

      if (alerts.length > 0) {
        await tx.alert.createMany({
          data: alerts.map((alert) => ({
            investigationId,
            ruleKey: alert.ruleKey,
            title: alert.title,
            level: alert.level,
            tag: alert.tag,
            explanation: alert.explanation,
            evidenceDocumentId: alert.evidenceDocumentId,
            evidenceFieldId: alert.evidenceFieldId,
            evidenceValue: alert.evidenceValue,
            sourceLabel: alert.sourceLabel,
            documentDate: alert.documentDate,
            whyItMatters: alert.whyItMatters,
            nextStep: alert.nextStep,
            professionalAdvice: alert.professionalAdvice,
          })),
        });
      }

      if (checklist.length > 0) {
        await tx.checklistItem.createMany({
          data: checklist.map((item) => ({
            investigationId,
            key: item.key,
            label: item.label,
            authority: item.authority,
            groupLabel: item.groupLabel,
            requirement: item.requirement,
            guidanceOnly: item.guidanceOnly,
            tags: item.tags,
            status: item.status,
            satisfiedByDocumentId: item.satisfiedByDocumentId,
            note: item.note,
            sourceSlug: item.sourceSlug,
            sortOrder: item.sortOrder,
          })),
        });
      }

      await tx.investigation.update({
        where: { id: investigationId },
        data: { updatedAt: new Date() },
      });

      return {
        comparisons: comparisonRows.length,
        alerts: alerts.length,
        checklist: checklist.length,
        claims: evaluatedClaims.length,
      };
    },
    { timeout: 20_000 },
  );
}
