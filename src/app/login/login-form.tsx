"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Notice } from "@/components/ui";
import { loginAction, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.message ? (
        <Notice tone="danger" title="Could not sign in">
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
          autoComplete="current-password"
          required
          className="field-input mt-1"
        />
      </div>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function LoginFootnote() {
  return (
    <p className="mt-6 border-t border-rule pt-4 text-sm text-muted">
      No account yet? <Link href="/register">Create one</Link>, or{" "}
      <Link href="/sample">view the sample investigation</Link> without signing
      in.
    </p>
  );
}
