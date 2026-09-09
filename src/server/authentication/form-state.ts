export type AuthFieldErrors = Record<string, string[] | undefined>;

export type AuthFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: AuthFieldErrors;
};

export const initialAuthFormState: AuthFormState = { status: "idle" };
