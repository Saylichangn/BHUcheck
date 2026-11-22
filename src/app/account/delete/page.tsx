import type { Metadata } from "next";
import { Notice } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = {
  title: "Delete account",
};

export default async function DeleteAccountPage() {
  const user = await requireUser();

  return (
    <div className="max-w-2xl">
      <p className="mono-label">Permanent action</p>
      <h1 className="mt-2 text-3xl">Delete account</h1>
      <p className="mt-3 text-sm leading-relaxed">
        This deletes the account for <strong>{user.email}</strong> and every
        investigation, document, extracted value, seller statement, alert,
        checklist answer, report and uploaded file belonging to it. This cannot
        be undone.
      </p>

      <div className="mt-6">
        <Notice tone="warn" title="What is not deleted">
          Rate-limit records are kept until they expire. Public questionnaire
          answers saved without an account are not linked to this account.
        </Notice>
      </div>

      <DeleteAccountForm />
    </div>
  );
}
