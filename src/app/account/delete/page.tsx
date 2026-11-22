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
    <div className="page-shell page-body">
      <div className="max-w-3xl">
        <p className="eyebrow text-danger">Permanent action</p>
        <h1 className="mt-5 text-[clamp(2.8rem,7vw,5rem)] leading-[0.92]">
          Delete account
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.75]">
          This deletes the account for{" "}
          <strong className="font-semibold">{user.email}</strong> and every
          investigation, document, extracted value, seller statement, alert,
          checklist answer, report and uploaded file belonging to it. This
          cannot be undone.
        </p>

        <div className="mt-8 max-w-2xl">
          <Notice tone="warn" title="What is not deleted">
            Rate-limit records are kept until they expire. Public questionnaire
            answers saved without an account are not linked to this account.
          </Notice>
        </div>

        <DeleteAccountForm />
      </div>
    </div>
  );
}
