import { notFound, permanentRedirect } from "next/navigation";

import { getPublishedProduct } from "@/server/services/product-catalogue";

export default async function LegacyProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await getPublishedProduct((await params).id);
  if (!product) notFound();
  permanentRedirect(`/marketplace/${product.slug}`);
}
