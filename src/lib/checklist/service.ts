import { prisma } from "@/lib/db";

export async function saveChecklistReview(input: {
  userId: string;
  investigationId: string;
  requirementKey: string;
  checked: boolean;
}) {
  if (!input.requirementKey || input.requirementKey.length > 80) return false;

  const investigation = await prisma.investigation.findFirst({
    where: { id: input.investigationId, userId: input.userId },
    select: { id: true },
  });

  if (!investigation) return false;

  await prisma.checklistReview.upsert({
    where: {
      investigationId_requirementKey: {
        investigationId: input.investigationId,
        requirementKey: input.requirementKey,
      },
    },
    create: {
      investigationId: input.investigationId,
      requirementKey: input.requirementKey,
      checked: input.checked,
    },
    update: { checked: input.checked },
  });

  return true;
}
