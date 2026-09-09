import { Card } from "@/components";
import { getActiveProductCategories } from "@/server/services/product-catalogue";
import { createProductAction } from "../actions";
import { ProductForm } from "../product-form";
export default async function NewProductPage() { const categories = await getActiveProductCategories(); return <section className="max-w-4xl"><p className="market-label text-sack">New catalogue item</p><h1 className="mt-3 font-display text-4xl font-black text-coop">Create product</h1><p className="mt-2 text-coop/65">Save the core details first, then add images, variants and bulk pricing.</p><Card className="mt-7 p-5 sm:p-7"><ProductForm action={createProductAction} categories={categories} label="Create draft"/></Card></section>; }
