"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Drawer } from "@/components/ui/overlays";

type Category = { slug: string; name: string; children: Array<{ slug: string; name: string }> };
type Facets = { species: string[]; conditions: string[]; sellers: Array<{ slug: string; name: string }>; attributes: Array<{ key: string; value: string }> };
type Values = Record<string, string | undefined>;

const control = "min-h-11 w-full rounded-control border border-coop/20 bg-white px-3 text-sm text-coop outline-none focus:border-palm focus:ring-3 focus:ring-palm/15";

function FilterFields({ categories, facets, values, lockedCategory, lockedSubcategory }: { categories: Category[]; facets: Facets; values: Values; lockedCategory?: string; lockedSubcategory?: string }) {
  const [selectedCategory, setSelectedCategory] = useState(lockedCategory || values.category || "");
  const children = categories.find((category) => category.slug === selectedCategory)?.children || [];
  const attributeOptions = [...new Map(facets.attributes.map((item) => [`${item.key}:${item.value}`, item])).values()];
  return <div className="space-y-5">
    {!lockedCategory ? <label className="block text-sm font-bold text-coop">Category<select className={`${control} mt-1.5`} name="category" onChange={(event) => setSelectedCategory(event.target.value)} value={selectedCategory}><option value="">All categories</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label> : <input name="category" type="hidden" value={lockedCategory}/>}
    {!lockedSubcategory && children.length ? <label className="block text-sm font-bold text-coop">Subcategory<select className={`${control} mt-1.5`} defaultValue={values.subcategory || ""} name="subcategory"><option value="">All in category</option>{children.map((child) => <option key={child.slug} value={child.slug}>{child.name}</option>)}</select></label> : lockedSubcategory ? <input name="subcategory" type="hidden" value={lockedSubcategory}/> : null}
    <label className="block text-sm font-bold text-coop">Species<select className={`${control} mt-1.5`} defaultValue={values.species || ""} name="species"><option value="">All species</option>{facets.species.map((value) => <option key={value}>{value}</option>)}</select></label>
    <div><p className="text-sm font-bold text-coop">Price range</p><div className="mt-1.5 grid grid-cols-2 gap-2"><input className={control} defaultValue={values.minPrice} inputMode="decimal" min="0" name="minPrice" placeholder="Min ₦" type="number"/><input className={control} defaultValue={values.maxPrice} inputMode="decimal" min="0" name="maxPrice" placeholder="Max ₦" type="number"/></div></div>
    <label className="block text-sm font-bold text-coop">Condition<select className={`${control} mt-1.5`} defaultValue={values.condition || ""} name="condition"><option value="">Any condition</option>{facets.conditions.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="block text-sm font-bold text-coop">Seller<select className={`${control} mt-1.5`} defaultValue={values.seller || ""} name="seller"><option value="">All approved sellers</option>{facets.sellers.map((seller) => <option key={seller.slug} value={seller.slug}>{seller.name}</option>)}</select></label>
    {attributeOptions.length ? <label className="block text-sm font-bold text-coop">Product attribute<select className={`${control} mt-1.5`} defaultValue={values.attribute || ""} name="attribute"><option value="">Any breed, age or pack</option>{attributeOptions.map((item) => <option key={`${item.key}:${item.value}`} value={`${item.key}:${item.value}`}>{item.key.replaceAll("_", " ")}: {item.value}</option>)}</select></label> : null}
    <label className="flex items-center gap-3 text-sm font-semibold text-coop"><input className="size-5 accent-palm" defaultChecked={values.inStock === "1"} name="inStock" type="checkbox" value="1"/>In-stock products only</label>
    {values.q ? <input name="q" type="hidden" value={values.q}/> : null}
    {values.sort ? <input name="sort" type="hidden" value={values.sort}/> : null}
    <Button className="w-full" type="submit">Apply filters</Button>
  </div>;
}

export function MarketplaceFilters(props: { categories: Category[]; facets: Facets; values: Values; action?: string; lockedCategory?: string; lockedSubcategory?: string }) {
  const [open, setOpen] = useState(false);
  const action = props.action || "/marketplace";
  return <>
    <Button className="w-full lg:hidden" onClick={() => setOpen(true)} variant="outline"><Icon className="size-5" name="categories"/>Filter products</Button>
    <aside className="hidden rounded-card border border-coop/10 bg-white p-5 shadow-label lg:block"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-bold text-coop">Filter products</h2><a className="text-xs font-bold text-palm" href={action}>Clear</a></div><form action={action}><FilterFields {...props}/></form></aside>
    <Drawer onClose={() => setOpen(false)} open={open} title="Filter products"><form action={action}><FilterFields {...props}/></form><a className="mt-4 block text-center text-sm font-bold text-palm" href={action}>Clear all filters</a></Drawer>
  </>;
}
