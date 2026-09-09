import { logoutAction } from "@/app/(auth)/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
