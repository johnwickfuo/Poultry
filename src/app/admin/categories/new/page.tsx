import { Card } from "@/components";
import { getTopLevelCategoryOptions } from "@/server/categories";
import { createCategoryAction } from "../actions";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  const parents = await getTopLevelCategoryOptions();
  return <section className="max-w-3xl"><p className="market-label text-sack">Taxonomy editor</p><h1 className="mt-3 font-display text-4xl font-black text-coop">Create category</h1><p className="mt-2 text-coop/65">Create a top-level poultry category or place it under an existing parent.</p><Card className="mt-7 p-5 sm:p-7"><CategoryForm action={createCategoryAction} parents={parents} submitLabel="Create category"/></Card></section>;
}
