import { MARKETPLACE_ATTRIBUTE_KEYS, type MarketplaceFilters, type MarketplaceSort } from "@/server/services/marketplace-search";
import { nairaToKobo } from "./product";

export type PublicSearchParams = Record<string, string | string[] | undefined>;

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseMarketplaceParams(params: PublicSearchParams, fixed: Partial<MarketplaceFilters> = {}): MarketplaceFilters {
  const value = (key: string) => firstParam(params[key])?.trim() || undefined;
  const sortValue = value("sort");
  const sort: MarketplaceSort = ["newest", "price-asc", "price-desc", "popularity"].includes(sortValue || "") ? sortValue as MarketplaceSort : "newest";
  const attribute = value("attribute")?.split(":", 2);
  const attributeKey = MARKETPLACE_ATTRIBUTE_KEYS.includes(attribute?.[0] as (typeof MARKETPLACE_ATTRIBUTE_KEYS)[number]) ? attribute?.[0] as (typeof MARKETPLACE_ATTRIBUTE_KEYS)[number] : undefined;
  const page = Number.parseInt(value("page") || "1", 10);
  return {
    q: value("q")?.slice(0, 120), category: value("category"), subcategory: value("subcategory"), species: value("species"),
    minPriceKobo: nairaToKobo(value("minPrice") || ""), maxPriceKobo: nairaToKobo(value("maxPrice") || ""),
    condition: value("condition"), seller: value("seller"), inStock: value("inStock") === "1",
    attributeKey, attributeValue: attributeKey ? attribute?.[1]?.trim().slice(0, 100) : undefined,
    sort, page: Number.isFinite(page) && page > 0 ? page : 1, ...fixed,
  };
}

export function marketplacePageHref(pathname: string, params: PublicSearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) { const value = firstParam(raw); if (value && key !== "page") query.set(key, value); }
  if (page > 1) query.set("page", String(page));
  return query.size ? `${pathname}?${query}` : pathname;
}

export function filterFormValues(params: PublicSearchParams) {
  return Object.fromEntries(Object.entries(params).map(([key, value]) => [key, firstParam(value)]));
}
