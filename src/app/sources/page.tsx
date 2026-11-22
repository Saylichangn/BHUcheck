import type { Metadata } from "next";
import { Landscape } from "@/components/landscape";
import { Notice } from "@/components/ui";
import { governmentSources } from "@/lib/domain/sources";

export const metadata: Metadata = {
  title: "Government sources",
};

export default function SourcesPage() {
  return (
    <div>
      <section className="page-hero">
        <Landscape />
        <div className="page-shell">
          <div className="pb-10 pt-8 sm:pb-12">
            <p className="eyebrow text-lime">Directory</p>
            <h1 className="mt-6 max-w-4xl text-[clamp(3rem,8vw,6.4rem)] leading-[0.9]">
              <span className="block">Government</span>{" "}
              <span className="display-italic block">sources</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-paper/70">
              These are the offices and portals that hold Maharashtra land,
              revenue, registration, municipal and court records. BHUcheck does
              not query or scrape any of them. Open the source yourself, obtain
              the record, and upload the copy you receive.
            </p>
          </div>
        </div>
      </section>

      <div className="page-shell page-body">
        <Notice tone="warn" title="No automated access">
          BHUcheck has no connection to these systems. Availability, fees,
          login requirements and coverage change. Confirm the current procedure
          on the portal or at the office.
        </Notice>

        <div className="mt-10">
          {governmentSources.map((source) => (
            <article
              key={source.slug}
              id={source.slug}
              className="scroll-mt-28 border-t border-ink py-9 first:border-t-0 first:pt-0"
            >
              <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-12">
                <div>
                  <h2 className="max-w-lg text-[clamp(1.7rem,3vw,2.5rem)]">
                    {source.name}
                  </h2>
                  <p className="mono-label mt-3">{source.department}</p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] no-underline underline-offset-4 hover:underline"
                  >
                    Open the official site
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      className="h-3 w-3 text-forest"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    >
                      <path d="M2 10 10 2M4 2h6v6" />
                    </svg>
                  </a>
                </div>

                <div>
                  <dl className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <dt className="mono-label">What it may hold</dt>
                      <dd className="mt-2 text-sm leading-[1.7]">
                        {source.whatItMayHold}
                      </dd>
                    </div>
                    <div>
                      <dt className="mono-label">What you do</dt>
                      <dd className="mt-2 text-sm leading-[1.7]">
                        {source.userAction}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-6 border-t border-rule pt-4 text-xs leading-relaxed text-muted">
                    <span className="mono-label mr-2">Known limits</span>
                    {source.knownLimits}
                  </p>
                  <p className="mt-2 break-all font-mono text-[10.5px] leading-relaxed text-muted">
                    {source.url}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
