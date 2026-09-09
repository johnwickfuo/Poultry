const foundations = [
  "Next.js App Router and TypeScript",
  "Tailwind CSS",
  "Prisma and MySQL",
  "Auth.js and role-based authorization",
  "Vitest, React Testing Library, and Playwright",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20 sm:px-10">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
        Internal foundation
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
        Poultry platform
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
        The application foundation is ready for product requirements and domain
        workflows.
      </p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Configured foundation">
        {foundations.map((foundation) => (
          <li
            key={foundation}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm"
          >
            {foundation}
          </li>
        ))}
      </ul>
    </main>
  );
}
