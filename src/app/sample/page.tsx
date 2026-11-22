import type { Metadata } from "next";
import Link from "next/link";
import { LevelBadge } from "@/components/badges";
import { Landscape } from "@/components/landscape";
import { Badge, ButtonLink, Notice, Section } from "@/components/ui";
import { sampleInvestigation } from "@/lib/demo/sample";

export const metadata: Metadata = {
  title: "Sample investigation",
};

const data = sampleInvestigation;

export default function SamplePage() {
  return (
    <div>
      <section className="page-hero">
        <Landscape />
        <div className="page-shell">
          <div className="pb-10 pt-8 sm:pb-12">
            <p className="eyebrow text-lime">Read-only example</p>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="max-w-4xl text-[clamp(2.7rem,6vw,4.8rem)] leading-[0.94]">
                  {data.nickname}
                </h1>
                <p className="mt-4 max-w-3xl font-mono text-[11px] uppercase tracking-[0.08em] text-paper/60">
                  {[data.village, data.taluka, data.district]
                    .filter(Boolean)
                    .join(", ")}
                  {" · Survey no. "}
                  {data.surveyNo}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink
                  href="/questionnaire"
                  variant="primary"
                >
                  Try the questionnaire
                </ButtonLink>
                <ButtonLink href="/register" className="btn-on-dark">
                  Create your own investigation
                </ButtonLink>
                <Link href="/sources" className="dark-link">
                  Government sources
                </Link>
              </div>
            </div>

            <dl className="stat-grid mt-10">
              <div className="stat-cell">
                <dt className="mono-label">Property type</dt>
                <dd>{data.propertyType}</dd>
              </div>
              <div className="stat-cell">
                <dt className="mono-label">Intended use</dt>
                <dd>{data.intendedUse}</dd>
              </div>
              <div className="stat-cell">
                <dt className="mono-label">District</dt>
                <dd>{data.district}</dd>
              </div>
              <div className="stat-cell">
                <dt className="mono-label">Survey / gat / CTS</dt>
                <dd>{data.surveyNo}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <div className="page-shell page-body">
        <Notice title="What you are seeing">
          This is a made-up example. No account, upload or signing in is needed
          to look at it. It shows the layout only; none of the names or figures
          are verified.
        </Notice>

        <Section
          title="Documents"
          description="The copies that were read. Text-layer PDFs are read directly; scanned copies use OCR."
        >
          <div className="overflow-x-auto">
            <table className="data-table min-w-[700px]">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">File</th>
                  <th scope="col">Uploaded</th>
                  <th scope="col">Text</th>
                  <th scope="col">Values</th>
                </tr>
              </thead>
              <tbody>
                {data.documents.map((document) => (
                  <tr key={document.name}>
                    <td className="whitespace-nowrap">{document.type}</td>
                    <td>
                      {document.name}
                      <p className="mt-1 text-xs text-muted">
                        {document.size} · {document.pages} page
                        {document.pages === 1 ? "" : "s"}
                        {document.note ? ` · ${document.note}` : ""}
                      </p>
                    </td>
                    <td className="whitespace-nowrap">
                      {document.uploadedAt}
                    </td>
                    <td>{document.text}</td>
                    <td>{document.fields}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Seller statements"
          description="What the seller said, checked against the values read from the documents."
        >
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th scope="col">Statement</th>
                  <th scope="col">Compared with</th>
                  <th scope="col">Seller states</th>
                  <th scope="col">Result</th>
                  <th scope="col">Basis</th>
                </tr>
              </thead>
              <tbody>
                {data.claims.map((claim) => (
                  <tr key={claim.text}>
                    <td className="max-w-sm">{claim.text}</td>
                    <td className="whitespace-nowrap">{claim.field}</td>
                    <td>{claim.stated}</td>
                    <td>
                      <Badge
                        tone={
                          claim.result === "Contradicted" ? "danger" : "neutral"
                        }
                      >
                        {claim.result}
                      </Badge>
                    </td>
                    <td className="max-w-sm text-xs">{claim.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Alerts"
          description="Potential inconsistencies raised by deterministic checks and statement analysis."
        >
          {data.alerts.map((alert) => (
            <article
              key={alert.title}
              className="border-t border-rule py-7 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={alert.level} />
                <Badge>{alert.tag}</Badge>
              </div>
              <h3 className="mt-3 max-w-3xl text-[1.5rem]">{alert.title}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed">
                {alert.explanation}
              </p>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="mono-label">Why it matters</dt>
                  <dd className="mt-1.5 max-w-lg text-sm leading-relaxed">
                    {alert.why}
                  </dd>
                </div>
                <div>
                  <dt className="mono-label">Next step</dt>
                  <dd className="mt-1.5 max-w-lg text-sm leading-relaxed">
                    {alert.next}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted">Source: {alert.source}</p>
              {alert.statement ? (
                <p className="mt-1 text-xs text-muted">
                  Seller statement: {alert.statement}
                </p>
              ) : null}
            </article>
          ))}
        </Section>

        <Section
          title="Document checklist"
          description="What is checked, what is still unchecked, and which office holds each record."
        >
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th scope="col">Requirement</th>
                  <th scope="col">Status</th>
                  <th scope="col">Authority</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                {data.checklist.map((item) => (
                  <tr key={item.label}>
                    <td className="font-medium">{item.label}</td>
                    <td>
                      <Badge tone={item.checked ? "ok" : "danger"}>
                        {item.checked ? "Checked" : "Unchecked"}
                      </Badge>
                    </td>
                    <td>{item.authority}</td>
                    <td className="max-w-xl text-xs leading-relaxed">
                      {item.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <div className="mt-14">
          <Notice tone="warn" title="Ready to check your own property?">
            Create a free account, add an investigation and record what you know.
            You can try the questionnaire without an account.
          </Notice>
        </div>
      </div>
    </div>
  );
}
