"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteUserStorage } from "@/lib/storage/files";

export type DeleteAccountState = {
  message?: string;
};

export async function deleteAccountAction(
  _state: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const user = await requireUser();

  if (formData.get("confirm") !== "yes") {
    return { message: "Confirm that you want to delete the account." };
  }

  await prisma.user.delete({ where: { id: user.id } });

  try {
    await deleteUserStorage(user.id);
  } catch (error) {
    console.error("Account storage cleanup failed.", error);
  }

  revalidatePath("/");
  redirect("/");
}
