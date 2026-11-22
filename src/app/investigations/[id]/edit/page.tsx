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
    <div>
      <p className="mono-label">Details</p>
      <h1 className="mt-2 text-3xl">Edit investigation</h1>
      <p className="mt-2 text-sm text-muted">
        Changing these details recalculates the comparison table and checklist.
      </p>
      <InvestigationForm mode="edit" values={investigation} />
    </div>
  );
}
