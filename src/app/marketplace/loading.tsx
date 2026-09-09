import { Skeleton } from "@/components";

export default function MarketplaceLoading() {
  return <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8"><Skeleton className="h-52 rounded-panel sm:h-72"/><div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 10 }, (_, index) => <div className="space-y-3 rounded-card border border-coop/8 bg-white p-3" key={index}><Skeleton className="aspect-[4/3]"/><Skeleton className="h-5 w-3/4"/><Skeleton className="h-3 w-1/2"/></div>)}</div><div className="mt-12 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]"><Skeleton className="hidden h-[34rem] lg:block"/><div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="space-y-3 rounded-card border border-coop/8 bg-white p-3" key={index}><Skeleton className="aspect-square"/><Skeleton className="h-4"/><Skeleton className="h-4 w-2/3"/><Skeleton className="h-6 w-1/2"/></div>)}</div></div></div>;
}
