"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClaim, deleteClaim } from "@/lib/claims/service";
import { analyseSellerClaim } from "@/lib/claims/analysis";
import { claimSchema } from "@/lib/validation/claims";

export type ClaimFormState = {
  message?: string;
  saved?: boolean;
};

export async function createClaimAction(
  _state: ClaimFormState,
  formData: FormData,
): Promise<ClaimFormState> {
  const user = await requireUser();
  const investigationId = formData.get("investigationId");

  if (typeof investigationId !== "string" || !investigationId) {
    return { message: "The investigation could not be found." };
  }

  const parsed = claimSchema.safeParse({
    fieldKey: formData.get("fieldKey"),
    text: formData.get("text"),
    claimedValue: formData.get("claimedValue"),
    claimedUnit: formData.get("claimedUnit"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Check the statement.",
    };
  }

  const claim = await createClaim({
    userId: user.id,
    investigationId,
    claim: {
      text: parsed.data.text,
      fieldKey: parsed.data.fieldKey,
      claimedValue: parsed.data.claimedValue,
      claimedUnit: parsed.data.claimedUnit,
    },
  });

  if (!claim) {
    return { message: "The investigation could not be found." };
  }

  const analysis = await analyseSellerClaim({
    userId: user.id,
    investigationId,
    claimId: claim.id,
    text: parsed.data.text,
    fieldKey: parsed.data.fieldKey,
    claimedValue: parsed.data.claimedValue,
    claimedUnit: parsed.data.claimedUnit,
  });

  revalidatePath(`/investigations/${investigationId}`);

  if (analysis.status === "rate_limited") {
    return {
      message: "Statement saved. AI analysis limit reached.",
      saved: true,
    };
  }

  if (analysis.status === "unavailable") {
    return {
      message: "Statement saved. AI analysis is unavailable right now.",
      saved: true,
    };
  }

  return { message: "Statement saved and checked.", saved: true };
}

export async function deleteClaimAction(formData: FormData) {
  const user = await requireUser();
  const claimId = formData.get("claimId");
  const investigationId = formData.get("investigationId");

  if (typeof claimId !== "string" || !claimId) return;
  if (typeof investigationId !== "string" || !investigationId) return;

  await deleteClaim({ userId: user.id, claimId });

  revalidatePath(`/investigations/${investigationId}`);
}
