import { Skeleton } from "@/components";

export default function CheckoutLoading() { return <div className="mx-auto max-w-5xl px-5 py-12"><Skeleton className="h-12 w-72"/><div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="space-y-3">{Array.from({ length: 3 }, (_, index) => <Skeleton className="h-28 rounded-card" key={index}/>)}</div><Skeleton className="h-72 rounded-card"/></div></div>; }
