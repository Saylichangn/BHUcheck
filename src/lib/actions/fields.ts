"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  addExtractedField,
  deleteExtractedField,
  updateExtractedField,
} from "@/lib/documents/service";
import { fieldSchema } from "@/lib/validation/claims";

export type FieldFormState = {
  message?: string;
  saved?: boolean;
};

export async function addFieldAction(
  _state: FieldFormState,
  formData: FormData,
): Promise<FieldFormState> {
  const user = await requireUser();
  const documentId = formData.get("documentId");
  const investigationId = formData.get("investigationId");

  if (typeof documentId !== "string" || !documentId) {
    return { message: "The document could not be found." };
  }

  if (typeof investigationId !== "string" || !investigationId) {
    return { message: "The investigation could not be found." };
  }

  const parsed = fieldSchema.safeParse({
    fieldKey: formData.get("fieldKey"),
    value: formData.get("value"),
    unit: formData.get("unit"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the value." };
  }

  const added = await addExtractedField({
    userId: user.id,
    documentId,
    fieldKey: parsed.data.fieldKey,
    value: parsed.data.value,
    unit: parsed.data.unit,
  });

  if (!added) {
    return { message: "The document could not be found." };
  }

  revalidatePath(`/investigations/${investigationId}`);
  return { message: "Value added.", saved: true };
}

export async function updateFieldAction(
  _state: FieldFormState,
  formData: FormData,
): Promise<FieldFormState> {
  const user = await requireUser();
  const fieldId = formData.get("fieldId");
  const investigationId = formData.get("investigationId");

  if (typeof fieldId !== "string" || !fieldId) {
    return { message: "The value could not be found." };
  }

  if (typeof investigationId !== "string" || !investigationId) {
    return { message: "The investigation could not be found." };
  }

  const parsed = fieldSchema.safeParse({
    fieldKey: formData.get("fieldKey"),
    value: formData.get("value"),
    unit: formData.get("unit"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the value." };
  }

  const updated = await updateExtractedField({
    userId: user.id,
    fieldId,
    value: parsed.data.value,
    unit: parsed.data.unit,
  });

  if (!updated) {
    return { message: "The value could not be found." };
  }

  revalidatePath(`/investigations/${investigationId}`);
  return { message: "Value corrected.", saved: true };
}

export async function deleteFieldAction(formData: FormData) {
  const user = await requireUser();
  const fieldId = formData.get("fieldId");
  const investigationId = formData.get("investigationId");

  if (typeof fieldId !== "string" || !fieldId) return;
  if (typeof investigationId !== "string" || !investigationId) return;

  await deleteExtractedField({ userId: user.id, fieldId });

  revalidatePath(`/investigations/${investigationId}`);
}
