"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Notice } from "@/components/ui";
import {
  deleteAccountAction,
  type DeleteAccountState,
} from "@/lib/actions/account";

const initialState: DeleteAccountState = {};

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(
    deleteAccountAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mt-8 max-w-2xl space-y-5 border border-danger/60 bg-sheet p-5 sm:p-6"
    >
      {state.message ? (
        <Notice tone="danger" title="Account not deleted">
          {state.message}
        </Notice>
      ) : null}

      <label className="flex items-start gap-3 border border-rule bg-paper p-4 text-sm leading-relaxed">
        <input
          type="checkbox"
          name="confirm"
          value="yes"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-danger"
        />
        <span>
          I understand that my account, investigations, documents, extracted
          values, seller statements, alerts, checklist answers, reports and
          uploaded files will all be deleted permanently.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-5">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Deleting…" : "Delete my account and all data"}
        </Button>
        <Link href="/investigations" className="btn no-underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
