import type { Metadata } from "next";
import { InvestigationForm } from "@/components/investigation-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "New investigation",
};

export default async function NewInvestigationPage() {
  await requireUser();

  return (
    <div className="page-shell page-body">
      <header className="max-w-4xl border-b border-ink pb-8">
        <p className="eyebrow text-forest">Step 1</p>
        <h1 className="mt-5 text-[clamp(2.8rem,7vw,5.2rem)] leading-[0.92]">
          New investigation
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-muted">
          Enter what identifies the parcel. Only the name, district and intended
          use are required. A survey number improves the survey-map and
          checklist steps.
        </p>
      </header>
      <InvestigationForm mode="create" />
    </div>
  );
}
