import { randomUUID } from "node:crypto";
import path from "node:path";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import type { FieldKey } from "@/lib/domain/fields";
import { isFieldKey } from "@/lib/domain/fields";
import { normalizeFieldValue } from "@/lib/domain/engine/values";
import type { DocumentType } from "@/lib/documents/types";
import { maxUploadBytes, detectFileType } from "@/lib/documents/file-types";
import { extractDocumentText, type ExtractionResult } from "@/lib/documents/extract-text";
import { parseDocument } from "@/lib/domain/extraction/parse";
import { deleteFile, saveFile, sha256Of } from "@/lib/storage/files";
import { documentStoragePath } from "@/lib/storage/paths";
import { refreshInvestigation } from "@/lib/investigations/refresh";
import type { AreaUnit } from "@/lib/investigations/types";
import { areaUnitValues } from "@/lib/investigations/types";

const extractionErrorNote =
  "The text could not be read from this file. Check the copy and add the fields manually.";

function safeFileName(value: string) {
  const base = path.basename(value).replace(/[\u0000-\u001f\u007f]+/g, "");
  const cleaned = base.replace(/[^\p{L}\p{N}._() \-]+/gu, "_").trim();
  return (cleaned || "document").slice(0, 255);
}

function isAreaUnit(value: string | null): value is AreaUnit {
  return Boolean(value && (areaUnitValues as readonly string[]).includes(value));
}

export type UploadDocumentInput = {
  userId: string;
  investigationId: string;
  documentType: DocumentType;
  originalName: string;
  data: Uint8Array;
};

export async function uploadDocument(
  input: UploadDocumentInput,
): Promise<{ documentId: string }> {
  if (input.data.byteLength === 0) {
    throw new Error("The uploaded file is empty.");
  }

  if (input.data.byteLength > maxUploadBytes) {
    throw new Error("The uploaded file is larger than 10 MB.");
  }

  const fileType = detectFileType(input.data);

  if (!fileType) {
    throw new Error("Upload a PDF, JPG or PNG file.");
  }

  const documentId = randomUUID();
  const storagePath = documentStoragePath({
    userId: input.userId,
    investigationId: input.investigationId,
    documentId,
    extension: fileType.extension,
  });

  await saveFile(storagePath, input.data);

  try {
    await prisma.document.create({
      data: {
        id: documentId,
        investigationId: input.investigationId,
        type: input.documentType,
        originalName: safeFileName(input.originalName),
        storagePath,
        mimeType: fileType.mimeType,
        sizeBytes: input.data.byteLength,
        sha256: sha256Of(input.data),
        extractionStatus: "pending",
      },
    });
  } catch (error) {
    await deleteFile(storagePath);
    throw error;
  }

  let extraction: ExtractionResult | null = null;

  try {
    extraction = await extractDocumentText({
      mimeType: fileType.mimeType,
      data: input.data,
    });

    const parsed = extraction.text
      ? parseDocument(input.documentType, extraction.text)
      : { fields: [], notes: [] };
    const notes = [extraction.note, ...parsed.notes].filter(
      (note): note is string => Boolean(note),
    );

    await prisma.$transaction([
      prisma.document.update({
        where: { id: documentId },
        data: {
          pageCount: extraction.pageCount,
          extractionStatus: extraction.status,
          extractedText: extraction.text,
          extractionNote: [...new Set(notes)].join("\n") || null,
          extractionError: null,
        },
      }),
      prisma.extractedField.createMany({
        data: parsed.fields.map((field) => ({
          documentId,
          fieldKey: field.fieldKey,
          ordinal: field.ordinal,
          value: field.value,
          normalizedValue: field.normalizedValue,
          unit: field.unit,
          sourceText: field.sourceText,
        })),
      }),
    ]);
  } catch (error) {
    console.error("Document text extraction failed.", error);
    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractionStatus: "failed",
        extractionNote: extractionErrorNote,
        extractionError:
          error instanceof Error ? error.message.slice(0, 1000) : "Unknown error",
      },
    });
  }

  await refreshInvestigation(input.investigationId);
  await writeAuditLog({
    userId: input.userId,
    investigationId: input.investigationId,
    action: "document.upload",
    entityType: "document",
    entityId: documentId,
    metadata: {
      documentType: input.documentType,
      mimeType: fileType.mimeType,
      sizeBytes: input.data.byteLength,
      extractionStatus: extraction?.status ?? "failed",
    },
  });

  return { documentId };
}

export async function deleteDocument(input: {
  userId: string;
  documentId: string;
}) {
  const document = await prisma.document.findFirst({
    where: { id: input.documentId, investigation: { userId: input.userId } },
    select: {
      id: true,
      investigationId: true,
      storagePath: true,
      originalName: true,
    },
  });

  if (!document) return false;

  await deleteFile(document.storagePath);
  await prisma.document.delete({ where: { id: document.id } });
  await refreshInvestigation(document.investigationId);
  await writeAuditLog({
    userId: input.userId,
    investigationId: document.investigationId,
    action: "document.delete",
    entityType: "document",
    entityId: document.id,
    metadata: { originalName: document.originalName },
  });

  return true;
}

async function findOwnedDocument(userId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, investigation: { userId } },
    select: { id: true, investigationId: true },
  });
}

function normalizedFor(fieldKey: FieldKey, value: string, unit: string | null) {
  return normalizeFieldValue(fieldKey, value, isAreaUnit(unit) ? unit : null);
}

export async function addExtractedField(input: {
  userId: string;
  documentId: string;
  fieldKey: FieldKey;
  value: string;
  unit: string | null;
}) {
  const document = await findOwnedDocument(input.userId, input.documentId);

  if (!document) return false;

  const last = await prisma.extractedField.findFirst({
    where: { documentId: document.id, fieldKey: input.fieldKey },
    orderBy: { ordinal: "desc" },
    select: { ordinal: true },
  });
  const normalized = normalizedFor(input.fieldKey, input.value, input.unit);

  await prisma.extractedField.create({
    data: {
      documentId: document.id,
      fieldKey: input.fieldKey,
      ordinal: (last?.ordinal ?? -1) + 1,
      value: input.value.trim(),
      normalizedValue: normalized.normalized,
      unit: normalized.unit,
      provenance: "manual_entry",
      userCorrected: true,
    },
  });

  await refreshInvestigation(document.investigationId);
  await writeAuditLog({
    userId: input.userId,
    investigationId: document.investigationId,
    action: "document.field_add",
    entityType: "document",
    entityId: document.id,
    metadata: { fieldKey: input.fieldKey },
  });

  return true;
}

export async function updateExtractedField(input: {
  userId: string;
  fieldId: string;
  value: string;
  unit: string | null;
}) {
  const field = await prisma.extractedField.findFirst({
    where: {
      id: input.fieldId,
      document: { investigation: { userId: input.userId } },
    },
    select: {
      id: true,
      fieldKey: true,
      document: { select: { id: true, investigationId: true } },
    },
  });

  if (!field || !isFieldKey(field.fieldKey)) {
    return false;
  }

  const fieldKey = field.fieldKey;
  const normalized = normalizedFor(fieldKey, input.value, input.unit);

  await prisma.extractedField.update({
    where: { id: field.id },
    data: {
      value: input.value.trim(),
      normalizedValue: normalized.normalized,
      unit: normalized.unit,
      userCorrected: true,
      provenance: "manual_correction",
    },
  });

  await refreshInvestigation(field.document.investigationId);
  await writeAuditLog({
    userId: input.userId,
    investigationId: field.document.investigationId,
    action: "document.field_update",
    entityType: "document",
    entityId: field.document.id,
    metadata: { fieldKey },
  });

  return true;
}

export async function deleteExtractedField(input: {
  userId: string;
  fieldId: string;
}) {
  const field = await prisma.extractedField.findFirst({
    where: {
      id: input.fieldId,
      document: { investigation: { userId: input.userId } },
    },
    select: {
      id: true,
      fieldKey: true,
      document: { select: { id: true, investigationId: true } },
    },
  });

  if (!field) return false;

  await prisma.extractedField.delete({ where: { id: field.id } });
  await refreshInvestigation(field.document.investigationId);
  await writeAuditLog({
    userId: input.userId,
    investigationId: field.document.investigationId,
    action: "document.field_delete",
    entityType: "document",
    entityId: field.document.id,
    metadata: { fieldKey: field.fieldKey },
  });

  return true;
}
