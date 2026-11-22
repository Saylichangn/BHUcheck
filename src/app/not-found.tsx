import Link from "next/link";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="page-shell page-body">
      <div className="grid items-end gap-8 border-b border-ink pb-12 md:grid-cols-[auto_minmax(0,1fr)] md:gap-14">
        <p
          aria-hidden="true"
          className="font-serif text-[clamp(6rem,18vw,13rem)] font-bold leading-[0.76] tracking-[-0.07em] text-forest"
        >
          404
        </p>
        <div className="md:pb-3">
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.94]">
            Not found
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.7]">
            The page or investigation does not exist, or it belongs to another
            account.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/investigations" variant="primary">
              Your investigations
            </ButtonLink>
            <Link href="/" className="btn no-underline">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
