import { Skeleton } from "@/components";

export default function CartLoading() { return <div className="mx-auto max-w-7xl px-5 py-12"><Skeleton className="h-12 w-64"/><div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_21rem]"><div className="space-y-4">{Array.from({ length: 3 }, (_, index) => <Skeleton className="h-44 rounded-card" key={index}/>)}</div><Skeleton className="h-72 rounded-card"/></div></div>; }
