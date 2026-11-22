import type { Metadata } from "next";
import { Notice } from "@/components/ui";
import { governmentSources } from "@/lib/domain/sources";

export const metadata: Metadata = {
  title: "Government sources",
};

export default function SourcesPage() {
  return (
    <div>
      <p className="mono-label">Directory</p>
      <h1 className="mt-2 text-3xl">Government sources</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        These are the offices and portals that hold Maharashtra land, revenue,
        registration, municipal and court records. BHUcheck does not query or
        scrape any of them. Open the source yourself, obtain the record, and
        upload the copy you receive.
      </p>

      <div className="mt-6">
        <Notice tone="warn" title="No automated access">
          BHUcheck has no connection to these systems. Availability, fees,
          login requirements and coverage change. Confirm the current procedure
          on the portal or at the office.
        </Notice>
      </div>

      <div className="mt-8">
        {governmentSources.map((source) => (
          <article
            key={source.slug}
            id={source.slug}
            className="scroll-mt-6 border-t border-rule py-6 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl">{source.name}</h2>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm"
              >
                Open the official site
              </a>
            </div>
            <p className="mono-label mt-1">{source.department}</p>

            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="mono-label">What it may hold</dt>
                <dd className="mt-1 text-sm leading-relaxed">
                  {source.whatItMayHold}
                </dd>
              </div>
              <div>
                <dt className="mono-label">What you do</dt>
                <dd className="mt-1 text-sm leading-relaxed">
                  {source.userAction}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-xs leading-relaxed text-muted">
              <span className="mono-label mr-2">Known limits</span>
              {source.knownLimits}
            </p>
            <p className="mt-1 break-all font-mono text-[11px] text-muted">
              {source.url}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
