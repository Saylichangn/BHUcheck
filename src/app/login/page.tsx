import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Landscape } from "@/components/landscape";
import { currentUser } from "@/lib/auth/session";
import { LoginFootnote, LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const user = await currentUser();

  if (user) redirect("/investigations");

  return (
    <div>
      <section className="page-hero">
        <Landscape />
        <div className="page-shell">
          <div className="pb-24 pt-10 sm:pb-28">
            <p className="eyebrow text-lime">Account</p>
            <h1 className="mt-5 text-[clamp(3rem,8vw,6.5rem)] leading-[0.9]">
              Sign in
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-paper/70">
              Your investigations and uploaded files are visible only to your
              account.
            </p>
          </div>
        </div>
      </section>

      <div className="page-shell pb-16">
        <div className="relative z-10 -mt-14 max-w-xl border border-ink border-t-[6px] border-t-lime bg-sheet p-6 sm:p-8">
          <LoginForm />
          <LoginFootnote />
        </div>
      </div>
    </div>
  );
}
