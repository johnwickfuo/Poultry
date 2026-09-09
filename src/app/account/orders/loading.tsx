import { Skeleton } from "@/components";

export default function OrdersLoading() {
  return <div className="space-y-4"><Skeleton className="h-10 w-56"/><Skeleton className="h-36 w-full"/><Skeleton className="h-36 w-full"/></div>;
}
