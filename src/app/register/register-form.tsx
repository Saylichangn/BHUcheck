"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Notice } from "@/components/ui";
import { registerAction, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.message ? (
        <Notice tone="danger" title="Could not create the account">
          {state.message}
        </Notice>
      ) : null}

      <div>
        <label htmlFor="email" className="mono-label block">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field-input mt-1"
        />
      </div>

      <div>
        <label htmlFor="password" className="mono-label block">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          className="field-input mt-1"
        />
        <p className="mt-1 text-xs text-muted">At least 10 characters.</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mono-label block">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="field-input mt-1"
        />
      </div>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}

export function RegisterFootnote() {
  return (
    <p className="mt-6 border-t border-rule pt-4 text-sm text-muted">
      Already have an account? <Link href="/login">Sign in</Link>. There is no
      email confirmation or password reset in this version.
    </p>
  );
}
