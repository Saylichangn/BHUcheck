import Link from "next/link";

export function SiteFooter({ email }: { email: string | null }) {
  return (
    <footer className="mt-16 border-t border-ink/60">
      <div className="mx-auto w-full max-w-[1080px] px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
        <p className="max-w-3xl">
          BHUcheck reads the documents you upload. It does not access government
          databases, and it does not certify title, ownership or legality. Every
          result is limited to the documents and details you have entered.
          Confirm anything that matters with the issuing authority and a
          qualified professional.
        </p>
        <p className="mt-3">
          <Link href="/sources">Government sources and what they hold</Link>
          {" · "}
          <Link href="/investigations">Investigations</Link>
          {email ? (
            <>
              {" · "}
              <Link href="/account/delete">Delete account</Link>
            </>
          ) : null}
        </p>
      </div>
    </footer>
  );
}
