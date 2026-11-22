import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { LoginFootnote, LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const user = await currentUser();

  if (user) redirect("/investigations");

  return (
    <div className="max-w-md">
      <p className="mono-label">Account</p>
      <h1 className="mt-2 text-3xl">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Your investigations and uploaded files are visible only to your
        account.
      </p>
      <LoginForm />
      <LoginFootnote />
    </div>
  );
}
