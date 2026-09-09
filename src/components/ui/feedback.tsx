"use client";

import { cn } from "@/lib/cn";
import { Icon } from "./icons";

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "palm" | "yolk" | "sack"; className?: string }) {
  const tones = { neutral: "bg-coop/8 text-coop", palm: "bg-palm/12 text-palm", yolk: "bg-yolk/25 text-coop", sack: "bg-sack/12 text-sack" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", tones[tone], className)}>{children}</span>;
}

export type Status = "active" | "pending" | "suspended" | "success" | "warning" | "error" | "draft";

export function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = { active: "bg-palm/12 text-palm", success: "bg-palm/12 text-palm", pending: "bg-yolk/25 text-coop", warning: "bg-yolk/25 text-coop", suspended: "bg-red-100 text-red-800", error: "bg-red-100 text-red-800", draft: "bg-coop/8 text-coop/70" };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize", styles[status])}><span className="size-1.5 rounded-full bg-current" />{status}</span>;
}

export function Toast({ title, description, tone = "success", onDismiss }: { title: string; description?: string; tone?: "success" | "warning" | "error"; onDismiss?: () => void }) {
  const tones = { success: "border-palm/25 bg-white", warning: "border-yolk bg-eggshell", error: "border-red-300 bg-red-50" };
  return <div className={cn("flex w-full max-w-sm items-start gap-3 rounded-card border p-4 shadow-crate", tones[tone])} role="status"><span className={cn("mt-0.5 flex size-6 items-center justify-center rounded-full", tone === "error" ? "bg-red-700 text-white" : tone === "warning" ? "bg-yolk text-coop" : "bg-palm text-white")}><Icon className="size-4" name={tone === "error" ? "close" : "check"}/></span><div className="min-w-0 flex-1"><p className="font-semibold text-coop">{title}</p>{description ? <p className="mt-1 text-sm text-coop/65">{description}</p> : null}</div>{onDismiss ? <button aria-label="Dismiss notification" className="text-coop/45 hover:text-coop" onClick={onDismiss} type="button"><Icon className="size-5" name="close"/></button> : null}</div>;
}

export function EmptyState({ title, description, action, icon = "categories" }: { title: string; description: string; action?: React.ReactNode; icon?: "categories" | "search" | "heart" | "cart" }) {
  return <div className="hatchery-grid rounded-panel border border-coop/10 px-6 py-12 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-card bg-yolk text-coop shadow-label"><Icon className="size-6" name={icon}/></span><h3 className="mt-5 font-display text-xl font-bold text-coop">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-coop/65">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-control bg-coop/10", className)} />;
}
