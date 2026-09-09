"use client";

import { useState } from "react";

import { ResponsiveImage } from "@/components/ui/commerce";

export function ProductGallery({ productName, images, fallback }: { productName: string; images: Array<{ id: string; path: string; altText: string | null }>; fallback: string }) {
  const gallery = images.length ? images : [{ id: "fallback", path: fallback, altText: productName }];
  const [activeId, setActiveId] = useState(gallery[0].id);
  const active = gallery.find((image) => image.id === activeId) || gallery[0];
  return <div><div className="relative aspect-square overflow-hidden rounded-panel border border-coop/10 bg-white shadow-crate"><ResponsiveImage alt={active.altText || productName} fill priority src={active.path}/></div>{gallery.length > 1 ? <div className="mt-3 grid grid-cols-5 gap-2">{gallery.map((image) => <button aria-label={`View ${image.altText || productName}`} className={`relative aspect-square overflow-hidden rounded-control border-2 bg-white ${image.id === active.id ? "border-palm" : "border-transparent"}`} key={image.id} onClick={() => setActiveId(image.id)} type="button"><ResponsiveImage alt="" fill src={image.path}/></button>)}</div> : null}</div>;
}
