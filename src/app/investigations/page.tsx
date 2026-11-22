import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Notice } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { formatDate, plural } from "@/lib/format";
import { intendedUseLabels } from "@/lib/investigations/types";
import { listInvestigations } from "@/lib/investigations/service";

export const metadata: Metadata = {
  title: "Investigations",
};

function locationOf(investigation: {
  village: string | null;
  taluka: string | null;
  district: string;
}) {
  return [investigation.village, investigation.taluka, investigation.district]
    .filter(Boolean)
    .join(", ");
}

function AlertCounts({
  critical,
  high,
  review,
}: {
  critical: number;
  high: number;
  review: number;
}) {
  if (critical + high + review === 0) {
    return <span className="text-muted">None raised</span>;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {critical > 0 ? (
        <Badge tone="danger">{`${critical} critical`}</Badge>
      ) : null}
      {high > 0 ? <Badge tone="danger">{`${high} high`}</Badge> : null}
      {review > 0 ? <Badge tone="warn">{`${review} review`}</Badge> : null}
    </span>
  );
}

export default async function InvestigationsPage() {
  const user = await requireUser();
  const investigations = await listInvestigations(user.id);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono-label">Your work</p>
          <h1 className="mt-2 text-3xl">Investigations</h1>
          <p className="mt-1 text-sm text-muted">
            Each investigation holds its own documents, comparisons, seller
            statements, alerts and checklist.
          </p>
        </div>
        <ButtonLink href="/investigations/new" variant="primary">
          New investigation
        </ButtonLink>
      </div>

      {investigations.length === 0 ? (
        <div className="mt-8 space-y-4">
          <Notice title="No investigations yet">
            Start with the district and the survey number you are checking.
            Upload whatever copies you already have; more documents can be
            added later.
          </Notice>
          <p className="text-sm">
            <Link href="/investigations/new">Create the first investigation</Link>
            {" · "}
            <Link href="/sources">See where records are held</Link>
          </p>
        </div>
      ) : (
        <>
          <p className="mono-label mt-8">
            {plural(investigations.length, "investigation")}
          </p>
          <div className="mt-2 overflow-x-auto border-t border-ink">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Location</th>
                  <th scope="col">Survey no.</th>
                  <th scope="col">Intended use</th>
                  <th scope="col">Documents</th>
                  <th scope="col">Alerts</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {investigations.map((investigation) => (
                  <tr key={investigation.id}>
                    <td>
                      <Link
                        href={`/investigations/${investigation.id}`}
                        className="font-medium"
                      >
                        {investigation.nickname}
                      </Link>
                    </td>
                    <td>{locationOf(investigation)}</td>
                    <td className="font-mono text-xs">
                      {investigation.surveyNo ?? "—"}
                    </td>
                    <td>{intendedUseLabels[investigation.intendedUse]}</td>
                    <td>{investigation.documentCount}</td>
                    <td>
                      <AlertCounts
                        critical={investigation.criticalCount}
                        high={investigation.highCount}
                        review={investigation.reviewCount}
                      />
                    </td>
                    <td className="whitespace-nowrap">
                      {formatDate(investigation.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Alert counts reflect the last recalculation from the uploaded
            documents and entered details. No alerts is not a clearance.
          </p>
        </>
      )}
    </div>
  );
}
