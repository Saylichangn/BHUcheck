import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvestigationForm } from "@/components/investigation-form";
import { requireUser } from "@/lib/auth/session";
import { getInvestigationForForm } from "@/lib/investigations/service";

export const metadata: Metadata = {
  title: "Edit investigation",
};

export default async function EditInvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const investigation = await getInvestigationForForm(user.id, id);

  if (!investigation) notFound();

  return (
    <div className="page-shell page-body">
      <header className="max-w-4xl border-b border-ink pb-8">
        <p className="eyebrow text-forest">Details</p>
        <h1 className="mt-5 text-[clamp(2.8rem,7vw,5.2rem)] leading-[0.92]">
          Edit investigation
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-muted">
          Changing these details recalculates the comparison table and
          checklist.
        </p>
      </header>
      <InvestigationForm mode="edit" values={investigation} />
    </div>
  );
}
