import { ProductCard } from "@/components/ui/commerce";

type ListingProduct = {
  slug: string;
  name: string;
  basePriceKobo: number;
  stockQuantity: number;
  unitLabel: string;
  isFeatured: boolean;
  images: Array<{ path: string }>;
  category: { imagePath: string | null };
  seller: { sellerProfile: { businessName: string | null; state: string | null } | null };
  variants: Array<{ name: string; priceKobo: number; stockQuantity: number }>;
  bulkPriceTiers: Array<unknown>;
};

export function ProductListingCard({ product }: { product: ListingProduct }) {
  const prices = [product.basePriceKobo, ...product.variants.map((variant) => variant.priceKobo)];
  const lowestPrice = Math.min(...prices);
  const variantSummary = product.variants.length ? product.variants.map((variant) => variant.name).join(" · ") : undefined;
  const inStock = product.stockQuantity > 0 || product.variants.some((variant) => variant.stockQuantity > 0);
  return <ProductCard badge={product.isFeatured ? "Featured" : undefined} hasBulkPricing={product.bulkPriceTiers.length > 0} href={`/marketplace/${product.slug}`} image={product.images[0]?.path || product.category.imagePath || "/images/poultry/live-birds.webp"} inStock={inStock} location={product.seller.sellerProfile?.state || undefined} name={product.name} price={lowestPrice / 100} seller={product.seller.sellerProfile?.businessName || "Approved seller"} unit={product.unitLabel} variantSummary={variantSummary}/>;
}
