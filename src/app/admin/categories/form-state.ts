export type CategoryFormState = { status: "idle" | "success" | "error"; message?: string; fieldErrors?: Record<string, string[] | undefined> };
export const initialCategoryFormState: CategoryFormState = { status: "idle" };
