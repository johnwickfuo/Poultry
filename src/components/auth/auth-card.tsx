import Link from "next/link";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: { label: string; linkLabel: string; href: string };
};

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-8">{children}</div>
      {footer ? (
        <p className="mt-7 text-center text-sm text-slate-600">
          {footer.label}{" "}
          <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href={footer.href}>
            {footer.linkLabel}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
