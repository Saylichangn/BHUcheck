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
    <form action={formAction} className="mt-6 max-w-xl space-y-5">
      {state.message ? (
        <Notice tone="danger" title="Account not deleted">
          {state.message}
        </Notice>
      ) : null}

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="confirm"
          value="yes"
          required
          className="mt-1"
        />
        <span>
          I understand that my account, investigations, documents, extracted
          values, seller statements, alerts, checklist answers, reports and
          uploaded files will all be deleted permanently.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
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
