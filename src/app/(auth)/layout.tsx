export default function AuthenticationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-100/80 to-transparent" />
      <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-amber-100/60 blur-3xl" />
      <div className="relative z-10 w-full">{children}</div>
    </main>
  );
}
