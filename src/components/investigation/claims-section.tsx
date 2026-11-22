import { Fragment } from "react";
import { ClaimBadge } from "@/components/badges";
import { ClaimForm } from "@/components/claim-form";
import { Button, Notice } from "@/components/ui";
import { deleteClaimAction } from "@/lib/actions/claims";
import { areaUnitLabels, type AreaUnit } from "@/lib/investigations/types";
import {
  fieldLabel,
  type InvestigationDetail,
} from "@/lib/investigations/service";

function unitLabel(unit: string | null) {
  if (!unit) return "";
  return unit in areaUnitLabels ? areaUnitLabels[unit as AreaUnit] : unit;
}

export function ClaimsSection({
  investigationId,
  claims,
}: {
  investigationId: string;
  claims: InvestigationDetail["claims"];
}) {
  return (
    <>
      {claims.length === 0 ? (
        <Notice title="No seller statements recorded">
          Record what the seller says about ownership, area, survey number,
          mortgage or approvals. Each statement is checked against the values
          read from the uploaded documents.
        </Notice>
      ) : (
        <div className="overflow-x-auto border border-ink bg-sheet">
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th scope="col">Statement</th>
                <th scope="col">Compared with</th>
                <th scope="col">Seller states</th>
                <th scope="col">Result</th>
                <th scope="col">Basis</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <Fragment key={claim.id}>
                  <tr>
                    <td className="max-w-sm">{claim.text}</td>
                    <td className="whitespace-nowrap">
                      {claim.fieldKey ? fieldLabel(claim.fieldKey) : "—"}
                    </td>
                    <td>
                      {claim.claimedValue
                        ? `${claim.claimedValue}${
                            claim.claimedUnit
                              ? ` ${unitLabel(claim.claimedUnit)}`
                              : ""
                          }`
                        : "—"}
                    </td>
                    <td>
                      <ClaimBadge status={claim.status} />
                    </td>
                    <td className="max-w-sm text-xs">
                      {claim.rationale ?? "No document value to compare."}
                      {claim.evidenceDocumentId ? (
                        <a
                          href={`/api/documents/${claim.evidenceDocumentId}/file`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]"
                        >
                          View the document used
                        </a>
                      ) : null}
                    </td>
                    <td>
                      <form action={deleteClaimAction}>
                        <input
                          type="hidden"
                          name="investigationId"
                          value={investigationId}
                        />
                        <input type="hidden" name="claimId" value={claim.id} />
                        <Button
                          type="submit"
                          variant="danger"
                          className="px-2.5 py-1.5 text-[9.5px]"
                        >
                          Remove
                        </Button>
                      </form>
                    </td>
                  </tr>
                  {claim.aiAnswer ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border-t border-rule bg-accent-soft/50 p-4 text-sm"
                      >
                        <p className="mono-label">AI response</p>
                        <p className="mt-2 leading-[1.7]">{claim.aiAnswer}</p>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <ClaimForm investigationId={investigationId} />
      </div>

      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
        Supported means the uploaded documents agree with the statement.
        Contradicted means an extracted value differs. Neither result decides
        whether the statement is true.
      </p>
    </>
  );
}
