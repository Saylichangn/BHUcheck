import Link from "next/link";
import { Landscape } from "@/components/landscape";
import { ButtonLink, Notice } from "@/components/ui";
import { currentUser } from "@/lib/auth/session";

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function FeatureIcon({ name }: { name: "documents" | "comparison" | "checklist" }) {
  if (name === "documents") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4M9 12h6M9 16h6" />
      </svg>
    );
  }

  if (name === "comparison") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M4 7h16M4 17h16M8 3 4 7l4 4M16 13l4 4-4 4" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M4 4h16v16H4zM7 12l3 3 7-7" />
    </svg>
  );
}

export default async function HomePage() {
  const user = await currentUser();

  return (
    <div>
      <section className="page-hero">
        <Landscape />
        <div className="page-shell">
          <div className="hero-inner">
            <p className="eyebrow reveal text-lime">
              Property document investigation
            </p>
            <h1 className="hero-title reveal reveal-2 mt-5">
              <span className="display-upper">Read the papers</span>{" "}
              <span className="display-italic">before you pay.</span>
            </h1>

            <div className="mt-9 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <p className="hero-copy reveal reveal-3">
                Upload the property documents you have. BHUcheck extracts the
                key details, compares them across documents, and lists what
                still needs checking and where to check it.
              </p>

              <div className="reveal reveal-4 flex flex-wrap items-center gap-3">
                <ButtonLink
                  href="/sample"
                  variant="primary"
                  className="gap-3"
                >
                  View a sample investigation
                  <ArrowIcon />
                </ButtonLink>
                {user ? (
                  <>
                    <ButtonLink
                      href="/investigations"
                      className="btn-on-dark"
                    >
                      Open investigations
                    </ButtonLink>
                    <Link href="/sources" className="dark-link">
                      Government sources
                    </Link>
                  </>
                ) : (
                  <>
                    <ButtonLink href="/register" className="btn-on-dark">
                      Create an account
                    </ButtonLink>
                    <Link href="/login" className="dark-link">
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-shell page-body">
        <div className="grid border-t border-ink sm:grid-cols-3">
          <section className="border-b border-rule py-7 sm:border-b-0 sm:border-r sm:pr-8">
            <div className="text-forest">
              <FeatureIcon name="documents" />
            </div>
            <h2 className="mt-5 text-[1.7rem]">Documents</h2>
            <p className="mt-3 max-w-sm text-[14px] leading-[1.7] text-muted">
              PDF, JPG and PNG files up to 10 MB. Text-layer PDFs are read
              directly. Images and scanned PDFs are read with OCR in English and
              Marathi.
            </p>
          </section>
          <section className="border-b border-rule py-7 sm:border-b-0 sm:border-r sm:px-8">
            <div className="text-forest">
              <FeatureIcon name="comparison" />
            </div>
            <h2 className="mt-5 text-[1.7rem]">Comparison</h2>
            <p className="mt-3 max-w-sm text-[14px] leading-[1.7] text-muted">
              Names, survey numbers, area, land classification and registration
              numbers are compared between the documents and against what the
              seller states.
            </p>
          </section>
          <section className="py-7 sm:pl-8">
            <div className="text-forest">
              <FeatureIcon name="checklist" />
            </div>
            <h2 className="mt-5 text-[1.7rem]">Checklist</h2>
            <p className="mt-3 max-w-sm text-[14px] leading-[1.7] text-muted">
              The checklist points to the office that holds each record and
              marks steps that happen outside this tool as unconfirmed, not
              complete.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Notice tone="warn" title="What this is not">
            BHUcheck does not search government records, certify title, or say a
            property is safe. It reads the copies you provide. Use it to prepare
            questions for the Sub-Registrar, the Talathi, a lawyer and a
            surveyor.
          </Notice>
        </div>

        <div className="mt-12 border border-ink bg-lime px-6 py-7 sm:px-8 sm:py-8">
          <p className="max-w-4xl font-serif text-[1.75rem] leading-[1.12] tracking-[-0.02em] sm:text-[2.2rem]">
            Prefer to start with the public record offices?{" "}
            <Link
              href="/sources"
              className="underline decoration-ink/35 decoration-1 underline-offset-[5px] hover:decoration-ink"
            >
              See the government source directory
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
