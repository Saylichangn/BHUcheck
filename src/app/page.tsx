import Link from "next/link";
import { ButtonLink, Notice } from "@/components/ui";
import { currentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await currentUser();

  return (
    <div>
      <p className="mono-label">Property document investigation</p>
      <h1 className="mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">
        Read the papers before you pay.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed">
        Upload the property documents you have. BHUcheck extracts the key
        details, compares them across documents, and lists what still needs
        checking and where to check it.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink href="/sample">View a sample investigation</ButtonLink>
        {user ? (
          <>
            <ButtonLink href="/investigations" variant="primary">
              Open investigations
            </ButtonLink>
            <ButtonLink href="/sources">Government sources</ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href="/register" variant="primary">
              Create an account
            </ButtonLink>
            <ButtonLink href="/login">Sign in</ButtonLink>
          </>
        )}
      </div>

      <div className="mt-10 grid gap-6 border-t border-ink/60 pt-6 sm:grid-cols-3">
        <section>
          <h2 className="text-xl">Documents</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            PDF, JPG and PNG files up to 10 MB. Text-layer PDFs are read
            directly. Images and scanned PDFs are read with OCR in English and
            Marathi.
          </p>
        </section>
        <section>
          <h2 className="text-xl">Comparison</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Names, survey numbers, area, land classification and registration
            numbers are compared between the documents and against what the
            seller states.
          </p>
        </section>
        <section>
          <h2 className="text-xl">Checklist</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The checklist points to the office that holds each record and marks
            steps that happen outside this tool as unconfirmed, not complete.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Notice tone="warn" title="What this is not">
          BHUcheck does not search government records, certify title, or say a
          property is safe. It reads the copies you provide. Use it to prepare
          questions for the Sub-Registrar, the Talathi, a lawyer and a surveyor.
        </Notice>
      </div>

      <p className="mt-6 text-sm">
        Prefer to start with the public record offices?{" "}
        <Link href="/sources">See the government source directory</Link>.
      </p>
    </div>
  );
}
