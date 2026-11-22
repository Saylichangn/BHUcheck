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
    <section id={id} className={classes("section", className)}>
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          {description ? (
            <p className="section-description">{description}</p>
          ) : (
            <span />
          )}
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
      <div className="mt-7">{children}</div>
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
  return (
    <div className={`notice notice-${tone}`}>
      {title ? (
        <p className="mono-label mb-1 text-current">{title}</p>
      ) : null}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function EmptyRow({
  children,
  colSpan,
}: {
  children: ReactNode;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}
