import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { logoutAction } from "@/lib/actions/auth";

export function SiteHeader({ email }: { email: string | null }) {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-paper/15 bg-forest text-paper">
      <div className="page-shell flex flex-wrap items-center gap-x-8 gap-y-0 py-3 md:py-0">
        <Link
          href="/"
          className="flex min-h-[52px] items-center gap-3 no-underline"
        >
          <BrandMark />
          <span>
            <span className="block font-serif text-[22px] font-bold uppercase leading-none tracking-[-0.02em]">
              BHUcheck
            </span>
            <span className="mt-1 hidden font-mono text-[8.5px] uppercase tracking-[0.16em] text-paper/45 sm:block">
              Maharashtra property document checks
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 border-t border-paper/10 py-2.5 text-[11.5px] md:order-none md:w-auto md:flex-1 md:flex-nowrap md:overflow-visible md:border-0 md:py-0 md:text-[12px]"
        >
          <Link
            href="/investigations"
            className="shrink-0 whitespace-nowrap text-paper/70 no-underline transition-colors hover:text-lime"
          >
            Investigations
          </Link>
          <Link
            href="/sample"
            className="shrink-0 whitespace-nowrap text-paper/70 no-underline transition-colors hover:text-lime"
          >
            Sample
          </Link>
          <Link
            href="/questionnaire"
            className="shrink-0 whitespace-nowrap text-paper/70 no-underline transition-colors hover:text-lime"
          >
            Questionnaire
          </Link>
          <Link
            href="/sources"
            className="shrink-0 whitespace-nowrap text-paper/70 no-underline transition-colors hover:text-lime"
          >
            Government sources
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {email ? (
            <>
              <span className="hidden max-w-52 truncate font-mono text-[10px] text-paper/45 lg:inline">
                {email}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="btn btn-on-dark px-4 py-2.5 text-[9.5px]"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap text-[12px] text-paper/70 no-underline transition-colors hover:text-lime"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn btn-primary px-4 py-2.5 text-[9.5px] no-underline"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
