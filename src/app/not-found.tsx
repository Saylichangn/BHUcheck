import Link from "next/link";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="max-w-xl">
      <p className="mono-label">404</p>
      <h1 className="mt-2 text-3xl">Not found</h1>
      <p className="mt-3 text-sm leading-relaxed">
        The page or investigation does not exist, or it belongs to another
        account.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink href="/investigations" variant="primary">
          Your investigations
        </ButtonLink>
        <Link href="/" className="btn no-underline">
          Home
        </Link>
      </div>
    </div>
  );
}
