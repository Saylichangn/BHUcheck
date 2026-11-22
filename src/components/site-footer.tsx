import Link from "next/link";

export function SiteFooter({ email }: { email: string | null }) {
  return (
    <footer className="site-footer mt-24 bg-forest-deep text-paper">
      <div className="page-shell grid gap-12 py-14 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:py-16">
        <div>
          <p className="max-w-2xl text-[13.5px] leading-[1.75] text-paper/62">
            BHUcheck reads the documents you upload. It does not access
            government databases, and it does not certify title, ownership or
            legality. Every result is limited to the documents and details you
            have entered. Confirm anything that matters with the issuing
            authority and a qualified professional.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 self-end border-t border-paper/15 pt-7 md:border-t-0 md:pt-0"
        >
          <Link
            href="/sources"
            className="footer-link font-serif text-[1.15rem] leading-snug no-underline"
          >
            Government sources and what they hold
          </Link>
          <span className="inline-flex items-center gap-3">
            <span aria-hidden="true" className="font-mono text-paper/30">
              ·
            </span>
            <Link
              href="/investigations"
              className="footer-link font-serif text-[1.15rem] leading-snug no-underline"
            >
              Investigations
            </Link>
          </span>
          {email ? (
            <span className="inline-flex items-center gap-3">
              <span aria-hidden="true" className="font-mono text-paper/30">
                ·
              </span>
              <Link
                href="/account/delete"
                className="footer-link font-serif text-[1.15rem] leading-snug no-underline"
              >
                Delete account
              </Link>
            </span>
          ) : null}
        </nav>
      </div>
      <div className="h-2 bg-lime" />
    </footer>
  );
}
