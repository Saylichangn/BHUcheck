import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

export function SiteHeader({ email }: { email: string | null }) {
  return (
    <header className="border-b border-ink/60 bg-paper">
      <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <div>
          <Link
            href="/"
            className="font-serif text-2xl font-semibold leading-none no-underline"
          >
            BHUcheck
          </Link>
          <p className="mono-label mt-2">
            Maharashtra property document checks
          </p>
        </div>
        <nav
          aria-label="Main"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
        >
          <Link href="/investigations">Investigations</Link>
          <Link href="/sample">Sample</Link>
          <Link href="/questionnaire">Questionnaire</Link>
          <Link href="/sources">Government sources</Link>
          {email ? (
            <>
              <span className="hidden text-muted sm:inline">{email}</span>
              <form action={logoutAction}>
                <button type="submit" className="btn">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register" className="btn btn-primary no-underline">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
