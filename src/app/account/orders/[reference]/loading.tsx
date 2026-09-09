import { Skeleton } from "@/components";

export default function OrderLoading() {
  return <div className="space-y-4"><Skeleton className="h-10 w-72"/><Skeleton className="h-48 w-full"/><Skeleton className="h-64 w-full"/></div>;
}
