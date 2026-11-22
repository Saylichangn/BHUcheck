import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { RegisterFootnote, RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const user = await currentUser();

  if (user) redirect("/investigations");

  return (
    <div className="max-w-md">
      <p className="mono-label">Account</p>
      <h1 className="mt-2 text-3xl">Create account</h1>
      <p className="mt-2 text-sm text-muted">
        One account holds your own investigations. Files are stored privately
        and served only to the signed-in owner.
      </p>
      <RegisterForm />
      <RegisterFootnote />
    </div>
  );
}
