type SettingsFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
  errors?: string[];
};

export function SettingsField({
  label,
  description,
  errors,
  id,
  name,
  ...props
}: SettingsFieldProps) {
  const inputId = id ?? name;
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800" htmlFor={inputId}>
        {label}
      </label>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      <input
        {...props}
        aria-invalid={Boolean(errors?.length)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 aria-[invalid=true]:border-rose-500"
        id={inputId}
        name={name}
      />
      {errors?.map((error) => (
        <p className="mt-1 text-xs text-rose-700" key={error}>
          {error}
        </p>
      ))}
    </div>
  );
}

export function SettingsMessage({
  state,
}: {
  state: { status: "idle" | "success" | "error"; message?: string };
}) {
  if (!state.message) return null;
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        state.status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </div>
  );
}

export function SaveButton({ pending, label = "Save changes" }: { pending: boolean; label?: string }) {
  return (
    <button
      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
