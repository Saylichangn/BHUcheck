import type { Metadata } from "next";
import { InvestigationForm } from "@/components/investigation-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "New investigation",
};

export default async function NewInvestigationPage() {
  await requireUser();

  return (
    <div>
      <p className="mono-label">Step 1</p>
      <h1 className="mt-2 text-3xl">New investigation</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Enter what identifies the parcel. Only the name, district and intended
        use are required. A survey number improves the survey-map and
        checklist steps.
      </p>
      <InvestigationForm mode="create" />
    </div>
  );
}
