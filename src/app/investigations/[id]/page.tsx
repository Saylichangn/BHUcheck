import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Landscape } from "@/components/landscape";
import { AlertsSection } from "@/components/investigation/alerts-section";
import { ChecklistSection } from "@/components/investigation/checklist-section";
import { ClaimsSection } from "@/components/investigation/claims-section";
import { ReportsSection } from "@/components/investigation/reports-section";
import { UploadSection } from "@/components/investigation/upload-section";
import { QuestionnaireSection } from "@/components/questionnaire-section";
import { ButtonLink, Notice, Section } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  isQuestionnaireStatus,
  type QuestionnaireAnswer,
} from "@/lib/domain/questionnaire";
import {
  getInvestigationDetail,
  type InvestigationDetail,
} from "@/lib/investigations/service";
import { intendedUseLabels } from "@/lib/investigations/types";

export const metadata: Metadata = {
  title: "Investigation",
};

function locationOf(investigation: InvestigationDetail) {
  return [investigation.village, investigation.taluka, investigation.district]
    .filter(Boolean)
    .join(", ");
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="stat-cell">
      <dt className="mono-label">{label}</dt>
      <dd>{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

export default async function InvestigationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    upload?: string | string[];
    report?: string | string[];
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const investigation = await getInvestigationDetail(user.id, id);

  if (!investigation) notFound();

  const uploadResult = typeof query.upload === "string" ? query.upload : null;
  const reportResult = typeof query.report === "string" ? query.report : null;
  const initialAnswers: Record<string, QuestionnaireAnswer> = {};

  for (const answer of investigation.questionAnswers) {
    initialAnswers[answer.questionKey] = {
      status: isQuestionnaireStatus(answer.status) ? answer.status : "unsure",
      note: answer.note ?? "",
    };
  }

  return (
    <div>
      <section className="page-hero">
        <Landscape />
        <div className="page-shell">
          <div className="pb-10 pt-8 sm:pb-12">
            <p className="mono-label text-paper/55">
              <Link
                href="/investigations"
                className="no-underline transition-colors hover:text-lime"
              >
                Investigations
              </Link>{" "}
              / record
            </p>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="max-w-4xl text-[clamp(2.7rem,6vw,4.8rem)] leading-[0.94]">
                  {investigation.nickname}
                </h1>
                <p className="mt-4 max-w-3xl font-mono text-[11px] uppercase tracking-[0.08em] text-paper/60">
                  {locationOf(investigation)}
                  {investigation.surveyNo
                    ? ` · Survey no. ${investigation.surveyNo}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink
                  href={`/investigations/${investigation.id}/edit`}
                  variant="primary"
                >
                  Edit details
                </ButtonLink>
                <ButtonLink
                  href={`/investigations/${investigation.id}/delete`}
                  className="btn-on-dark"
                >
                  Delete investigation
                </ButtonLink>
              </div>
            </div>

            <dl className="stat-grid mt-10">
              <SummaryItem label="District" value={investigation.district} />
              <SummaryItem label="Taluka" value={investigation.taluka} />
              <SummaryItem
                label="Village or locality"
                value={investigation.village}
              />
              <SummaryItem
                label="Survey / gat / CTS"
                value={investigation.surveyNo}
              />
              <SummaryItem
                label="Intended use"
                value={intendedUseLabels[investigation.intendedUse]}
              />
              <SummaryItem
                label="Created"
                value={formatDate(investigation.createdAt)}
              />
              <SummaryItem
                label="Last updated"
                value={formatDateTime(investigation.updatedAt)}
              />
              <SummaryItem
                label="Documents"
                value={`${investigation.documents.length}`}
              />
            </dl>
          </div>
        </div>
      </section>

      <div className="page-shell page-body">
        <Notice title="Scope of these results">
          BHUcheck reads only the files and details entered here. It does not
          access government records or certify title. Confirm every potential
          inconsistency with the issuing authority. This page is not a
          clearance.
        </Notice>

        <Section
          title="Seller statements"
          description="What the seller has stated, checked against the values read from the uploaded documents."
        >
          <ClaimsSection
            investigationId={investigation.id}
            claims={investigation.claims}
          />
        </Section>

        <Section
          id="documents"
          title="Upload documents"
          description="Add the copies you have. Rules can only run on documents that are present."
        >
          <UploadSection
            investigationId={investigation.id}
            uploadResult={uploadResult}
            documentCount={investigation.documents.length}
          />
        </Section>

        <Section
          title="Alerts"
          description="Potential inconsistencies raised by the deterministic rules. Each alert names the next step and the source to confirm it with."
        >
          <AlertsSection
            alerts={investigation.alerts}
            ruleStatus={investigation.ruleStatus}
          />
        </Section>

        <Section
          id="questionnaire"
          title="Questionnaire"
          description="Thirty-one checks to work through before paying. Nothing is counted as done until you select DONE."
        >
          <QuestionnaireSection
            investigationId={investigation.id}
            state={investigation.state}
            initialAnswers={initialAnswers}
            canSave
          />
        </Section>

        <Section
          title="Document checklist"
          description="What is checked, what is still unchecked, and which office holds each record. Conditional items stay unchecked until the facts are known."
        >
          <ChecklistSection
            items={investigation.checklist}
            investigationId={investigation.id}
            initialReviews={Object.fromEntries(
              investigation.checklistReviews.map((review) => [
                review.requirementKey,
                review.checked,
              ]),
            )}
          />
        </Section>

        <Section
          id="reports"
          title="Reports"
          description="A dated PDF record of this investigation. Each version is kept so you can see what was known when it was generated."
        >
          <ReportsSection
            investigationId={investigation.id}
            reports={investigation.reports}
            result={reportResult}
          />
        </Section>
      </div>
    </div>
  );
}
