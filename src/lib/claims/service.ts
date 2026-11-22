import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { refreshInvestigation } from "@/lib/investigations/refresh";
import type { AreaUnit } from "@/lib/investigations/types";

export type ClaimInput = {
  text: string;
  fieldKey: string | null;
  claimedValue: string | null;
  claimedUnit: AreaUnit | null;
};

export async function createClaim(input: {
  userId: string;
  investigationId: string;
  claim: ClaimInput;
}) {
  const investigation = await prisma.investigation.findFirst({
    where: { id: input.investigationId, userId: input.userId },
    select: { id: true },
  });

  if (!investigation) return null;

  const claim = await prisma.claim.create({
    data: {
      investigationId: investigation.id,
      text: input.claim.text,
      fieldKey: input.claim.fieldKey,
      claimedValue: input.claim.claimedValue,
      claimedUnit: input.claim.claimedUnit,
    },
    select: { id: true },
  });

  await refreshInvestigation(investigation.id);
  await writeAuditLog({
    userId: input.userId,
    investigationId: investigation.id,
    action: "claim.create",
    entityType: "claim",
    entityId: claim.id,
    metadata: { fieldKey: input.claim.fieldKey },
  });

  return claim;
}

export async function deleteClaim(input: {
  userId: string;
  claimId: string;
}) {
  const claim = await prisma.claim.findFirst({
    where: {
      id: input.claimId,
      investigation: { userId: input.userId },
    },
    select: { id: true, investigationId: true, fieldKey: true },
  });

  if (!claim) return false;

  await prisma.claim.delete({ where: { id: claim.id } });
  await refreshInvestigation(claim.investigationId);
  await writeAuditLog({
    userId: input.userId,
    investigationId: claim.investigationId,
    action: "claim.delete",
    entityType: "claim",
    entityId: claim.id,
    metadata: { fieldKey: claim.fieldKey },
  });

  return true;
}
