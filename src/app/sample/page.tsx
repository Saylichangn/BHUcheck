import type { Metadata } from "next";
import Link from "next/link";
import { LevelBadge } from "@/components/badges";
import { Badge, ButtonLink, Notice, Section } from "@/components/ui";
import { sampleInvestigation } from "@/lib/demo/sample";

export const metadata: Metadata = {
  title: "Sample investigation",
};

const data = sampleInvestigation;

export default function SamplePage() {
  return (
    <div>
      <p className="mono-label">Read-only example</p>
      <h1 className="mt-2 text-3xl">{data.nickname}</h1>
      <p className="mt-1 text-sm text-muted">
        {[data.village, data.taluka, data.district].filter(Boolean).join(", ")}
        {" · Survey no. "}
        {data.surveyNo}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink href="/questionnaire" variant="primary">
          Try the questionnaire
        </ButtonLink>
        <ButtonLink href="/register">Create your own investigation</ButtonLink>
        <Link href="/sources" className="btn no-underline">
          Government sources
        </Link>
      </div>

      <div className="mt-6">
        <Notice title="What you are seeing">
          This is a made-up example. No account, upload or signing in is needed
          to look at it. It shows the layout only; none of the names or figures
          are verified.
        </Notice>
      </div>

      <dl className="mt-6 grid gap-x-6 gap-y-4 border-y border-rule py-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="mono-label">Property type</dt>
          <dd className="mt-1 text-sm">{data.propertyType}</dd>
        </div>
        <div>
          <dt className="mono-label">Intended use</dt>
          <dd className="mt-1 text-sm">{data.intendedUse}</dd>
        </div>
        <div>
          <dt className="mono-label">District</dt>
          <dd className="mt-1 text-sm">{data.district}</dd>
        </div>
        <div>
          <dt className="mono-label">Survey / gat / CTS</dt>
          <dd className="mt-1 text-sm">{data.surveyNo}</dd>
        </div>
      </dl>

      <Section
        title="Documents"
        description="The copies that were read. Text-layer PDFs are read directly; scanned copies use OCR."
      >
        <div className="overflow-x-auto border-t border-ink">
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
                  <td className="whitespace-nowrap">{document.uploadedAt}</td>
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
        <div className="overflow-x-auto border-t border-ink">
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
            className="border-t border-rule py-5 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={alert.level} />
              <Badge>{alert.tag}</Badge>
            </div>
            <h3 className="mt-2 text-xl">{alert.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed">
              {alert.explanation}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="mono-label">Why it matters</dt>
                <dd className="mt-1 text-sm leading-relaxed">{alert.why}</dd>
              </div>
              <div>
                <dt className="mono-label">Next step</dt>
                <dd className="mt-1 text-sm leading-relaxed">{alert.next}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">Source: {alert.source}</p>
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
        <div className="overflow-x-auto border-t border-ink">
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

      <div className="mt-10">
        <Notice tone="warn" title="Ready to check your own property?">
          Create a free account, add an investigation and record what you know.
          You can try the questionnaire without an account.
        </Notice>
      </div>
    </div>
  );
}
