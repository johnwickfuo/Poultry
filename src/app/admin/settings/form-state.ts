export type SettingsFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialSettingsFormState: SettingsFormState = { status: "idle" };
