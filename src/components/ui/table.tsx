import type { HTMLAttributes, TableHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <div className="overflow-x-auto rounded-card border border-coop/10 bg-white"><table className={cn("w-full border-collapse text-left text-sm", className)} {...props}/></div>;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-eggshell text-xs uppercase tracking-market text-coop/65 [&_th]:px-4 [&_th]:py-3", className)} {...props}/>;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-coop/10 [&_td]:px-4 [&_td]:py-3", className)} {...props}/>;
}
