import { Card } from "@/components";
import { requireApprovedSeller } from "@/server/authorization";
import { getProductForSeller } from "@/server/services/product-catalogue";
import { updateStockAction } from "../../actions";
import { StockForm } from "../../catalogue-forms";
import { ProductNav } from "../../product-nav";
export default async function StockPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const user = await requireApprovedSeller(); const product = await getProductForSeller(id, user.id); return <section className="max-w-3xl"><ProductNav id={id}/><h1 className="font-display text-4xl font-black text-coop">Stock</h1><p className="mt-2 text-coop/65">Stock can be zero, but can never be negative.</p><Card className="mt-6 p-5 sm:p-7"><StockForm action={updateStockAction.bind(null, id)} quantity={product.stockQuantity}/></Card></section>; }
