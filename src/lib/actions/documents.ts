"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { deleteDocument } from "@/lib/documents/service";

export async function deleteDocumentAction(formData: FormData) {
  const user = await requireUser();
  const documentId = formData.get("documentId");
  const investigationId = formData.get("investigationId");

  if (typeof documentId !== "string" || !documentId) return;
  if (typeof investigationId !== "string" || !investigationId) return;

  await deleteDocument({ userId: user.id, documentId });

  revalidatePath(`/investigations/${investigationId}`);
}
