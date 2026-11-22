import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui";
import { deleteInvestigationAction } from "@/lib/actions/investigations";
import { requireUser } from "@/lib/auth/session";
import { getInvestigationForForm } from "@/lib/investigations/service";

export const metadata: Metadata = {
  title: "Delete investigation",
};

export default async function DeleteInvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const investigation = await getInvestigationForForm(user.id, id);

  if (!investigation) notFound();

  return (
    <div className="max-w-xl">
      <p className="mono-label">Permanent action</p>
      <h1 className="mt-2 text-3xl">Delete “{investigation.nickname}”?</h1>
      <p className="mt-3 text-sm leading-relaxed">
        This deletes the investigation, its uploaded document files, extracted
        values, seller statements, alerts, checklist and any generated reports.
        The stored files are removed from disk. This cannot be undone.
      </p>

      <form action={deleteInvestigationAction} className="mt-6 space-y-4">
        <input type="hidden" name="investigationId" value={investigation.id} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required className="mt-1" />
          <span>I understand that the uploaded files will be deleted.</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="danger">
            Delete investigation
          </Button>
          <Link href={`/investigations/${investigation.id}`} className="btn no-underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
