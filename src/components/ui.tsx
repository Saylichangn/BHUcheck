import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Tone = "neutral" | "ok" | "warn" | "danger" | "accent";
type Variant = "secondary" | "primary" | "danger";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Button({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={classes(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "danger" && "btn-danger",
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "secondary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={classes(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "danger" && "btn-danger",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Section({
  id,
  title,
  description,
  actions,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={classes("mt-10 border-t border-ink/60 pt-5", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Notice({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "warn" | "danger" | "ok";
  title?: string;
  children: ReactNode;
}) {
  const border =
    tone === "warn"
      ? "border-warn"
      : tone === "danger"
        ? "border-danger"
        : tone === "ok"
          ? "border-ok"
          : "border-rule-strong";
  const background =
    tone === "warn"
      ? "bg-warn-soft"
      : tone === "danger"
        ? "bg-danger-soft"
        : tone === "ok"
          ? "bg-ok-soft"
          : "bg-sheet";

  return (
    <div className={`border border-l-4 px-4 py-3 ${border} ${background}`}>
      {title ? (
        <p className="mono-label mb-1 text-ink">{title}</p>
      ) : null}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function EmptyRow({ children, colSpan }: { children: ReactNode; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}
