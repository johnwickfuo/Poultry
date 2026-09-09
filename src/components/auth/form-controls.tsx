type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  errors?: string[];
  hint?: string;
};

export function FormField({
  label,
  errors,
  hint,
  id,
  name,
  ...props
}: FormFieldProps) {
  const inputId = id ?? name;
  const errorId = errors?.length ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(errors?.length)}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:focus:ring-rose-100"
        id={inputId}
        name={name}
      />
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-slate-500" id={hintId}>
          {hint}
        </p>
      ) : null}
      {errors?.length ? (
        <div id={errorId}>
          {errors.map((error) => (
            <p className="mt-2 text-sm text-rose-700" key={error}>
              {error}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FormMessage({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message?: string;
}) {
  if (!message) return null;

  return (
    <div
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
        status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-5 font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
