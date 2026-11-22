"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { deleteInvestigationStorage } from "@/lib/storage/files";
import { refreshInvestigation } from "@/lib/investigations/refresh";
import {
  investigationSchema,
  investigationUpdateSchema,
} from "@/lib/validation/investigation";

export type InvestigationFormState = {
  message?: string;
};

function firstIssue(error: {
  issues: Array<{ message: string }>;
}): InvestigationFormState {
  return { message: error.issues[0]?.message ?? "Check the form." };
}

function optionalValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function createInvestigationAction(
  _state: InvestigationFormState,
  formData: FormData,
): Promise<InvestigationFormState> {
  const user = await requireUser();
  const parsed = investigationSchema.safeParse({
    nickname: formData.get("nickname"),
    state: formData.get("state") ?? "Maharashtra",
    district: formData.get("district"),
    taluka: formData.get("taluka"),
    village: formData.get("village"),
    surveyNo: formData.get("surveyNo"),
    intendedUse: formData.get("intendedUse"),
    propertyType: formData.get("propertyType"),
  });

  if (!parsed.success) {
    return firstIssue(parsed.error);
  }

  const investigation = await prisma.investigation.create({
    data: {
      userId: user.id,
      nickname: parsed.data.nickname,
      state: "Maharashtra",
      district: parsed.data.district,
      taluka: optionalValue(formData.get("taluka")),
      village: optionalValue(formData.get("village")),
      surveyNo: optionalValue(formData.get("surveyNo")),
      intendedUse: parsed.data.intendedUse,
      propertyType: parsed.data.propertyType,
    },
    select: { id: true },
  });

  await refreshInvestigation(investigation.id);
  await writeAuditLog({
    userId: user.id,
    investigationId: investigation.id,
    action: "investigation.create",
    entityType: "investigation",
    entityId: investigation.id,
  });

  revalidatePath("/investigations");
  redirect(`/investigations/${investigation.id}`);
}

export async function updateInvestigationAction(
  _state: InvestigationFormState,
  formData: FormData,
): Promise<InvestigationFormState> {
  const user = await requireUser();
  const investigationId = formData.get("investigationId");

  if (typeof investigationId !== "string" || !investigationId) {
    return { message: "The investigation could not be found." };
  }

  const existing = await prisma.investigation.findFirst({
    where: { id: investigationId, userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return { message: "The investigation could not be found." };
  }

  const parsed = investigationUpdateSchema.safeParse({
    nickname: formData.get("nickname"),
    state: formData.get("state") ?? "Maharashtra",
    district: formData.get("district"),
    taluka: formData.get("taluka"),
    village: formData.get("village"),
    surveyNo: formData.get("surveyNo"),
    intendedUse: formData.get("intendedUse"),
    propertyType: formData.get("propertyType"),
  });

  if (!parsed.success) {
    return firstIssue(parsed.error);
  }

  await prisma.investigation.update({
    where: { id: investigationId },
    data: {
      nickname: parsed.data.nickname,
      district: parsed.data.district,
      taluka: optionalValue(formData.get("taluka")),
      village: optionalValue(formData.get("village")),
      surveyNo: optionalValue(formData.get("surveyNo")),
      intendedUse: parsed.data.intendedUse,
      propertyType: parsed.data.propertyType,
    },
  });

  await refreshInvestigation(investigationId);
  await writeAuditLog({
    userId: user.id,
    investigationId,
    action: "investigation.update",
    entityType: "investigation",
    entityId: investigationId,
  });

  revalidatePath(`/investigations/${investigationId}`);
  redirect(`/investigations/${investigationId}`);
}

export async function deleteInvestigationAction(formData: FormData) {
  const user = await requireUser();
  const investigationId = formData.get("investigationId");

  if (typeof investigationId !== "string" || !investigationId) {
    redirect("/investigations");
  }

  const existing = await prisma.investigation.findFirst({
    where: { id: investigationId, userId: user.id },
    select: { id: true, nickname: true },
  });

  if (!existing) {
    redirect("/investigations");
  }

  await deleteInvestigationStorage(user.id, existing.id);
  await prisma.investigation.delete({ where: { id: existing.id } });
  await writeAuditLog({
    userId: user.id,
    action: "investigation.delete",
    entityType: "investigation",
    entityId: existing.id,
    metadata: { nickname: existing.nickname },
  });

  revalidatePath("/investigations");
  redirect("/investigations");
}
