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
    <div className="page-shell page-body">
      <div className="max-w-3xl">
        <p className="eyebrow text-danger">Permanent action</p>
        <h1 className="mt-5 text-[clamp(2.8rem,7vw,5rem)] leading-[0.92]">
          Delete “{investigation.nickname}”?
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.75]">
          This deletes the investigation, its uploaded document files, extracted
          values, seller statements, alerts, checklist and any generated
          reports. The stored files are removed from disk. This cannot be
          undone.
        </p>

        <form
          action={deleteInvestigationAction}
          className="mt-8 max-w-2xl border border-danger/60 bg-sheet p-5 sm:p-6"
        >
          <input
            type="hidden"
            name="investigationId"
            value={investigation.id}
          />
          <label className="flex items-start gap-3 border border-rule bg-paper p-4 text-sm leading-relaxed">
            <input
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 shrink-0 accent-danger"
            />
            <span>I understand that the uploaded files will be deleted.</span>
          </label>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-rule pt-5">
            <Button type="submit" variant="danger">
              Delete investigation
            </Button>
            <Link
              href={`/investigations/${investigation.id}`}
              className="btn no-underline"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
