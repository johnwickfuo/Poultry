import { notFound } from "next/navigation";

import { Card, ResponsiveImage } from "@/components";
import { getAdminCategory, getTopLevelCategoryOptions } from "@/server/categories";
import { updateCategoryAction, uploadCategoryImageAction } from "../actions";
import { CategoryForm } from "../category-form";
import { CategoryImageForm } from "../image-form";

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [category, parentOptions] = await Promise.all([getAdminCategory(id), getTopLevelCategoryOptions()]);
  if (!category) notFound();
  const parents = parentOptions.filter((parent) => parent.id !== category.id);
  return <section><p className="market-label text-sack">Taxonomy editor</p><h1 className="mt-3 font-display text-4xl font-black text-coop">Edit {category.name}</h1>{query.created ? <p className="mt-5 rounded-control bg-palm/10 px-4 py-3 text-sm font-semibold text-palm">Category created. You can now add its artwork.</p> : null}<div className="mt-7 grid gap-6 xl:grid-cols-[1fr_22rem]"><Card className="p-5 sm:p-7"><CategoryForm action={updateCategoryAction.bind(null, category.id)} parents={parents} submitLabel="Save changes" values={category}/></Card><div className="space-y-5"><Card className="p-5"><h2 className="font-display text-xl font-bold text-coop">Category artwork</h2>{category.imagePath ? <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-control bg-eggshell"><ResponsiveImage alt={`${category.name} category`} fill src={category.imagePath}/></div> : <p className="mt-3 text-sm text-coop/55">No image uploaded.</p>}<div className="mt-5"><CategoryImageForm action={uploadCategoryImageAction.bind(null, category.id)}/></div></Card>{category.children.length ? <Card className="p-5"><h2 className="font-display text-xl font-bold text-coop">Subcategories</h2><ul className="mt-3 space-y-2 text-sm text-coop/65">{category.children.map((child) => <li key={child.id}>{child.name}</li>)}</ul></Card> : null}</div></div></section>;
}
