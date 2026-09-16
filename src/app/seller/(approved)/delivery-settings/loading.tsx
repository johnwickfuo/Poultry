import { Skeleton } from "@/components";

export default function DeliverySettingsLoading() {
  return <div className="space-y-5"><Skeleton className="h-10 w-72"/><Skeleton className="h-72 w-full"/><Skeleton className="h-72 w-full"/></div>;
}
