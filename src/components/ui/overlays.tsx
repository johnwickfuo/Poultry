"use client";

import { useEffect } from "react";

import { cn } from "@/lib/cn";
import { IconButton } from "./button";
import { Icon } from "./icons";

function useDismiss(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);
}

export function Modal({ open, onClose, title, description, children, className }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; className?: string }) {
  useDismiss(open, onClose);
  if (!open) return null;
  return <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-coop/60 p-4" onMouseDown={(event) => event.currentTarget === event.target && onClose()} role="dialog"><div className={cn("max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-panel bg-eggshell p-6 shadow-crate", className)}><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl font-bold text-coop">{title}</h2>{description ? <p className="mt-1 text-sm text-coop/65">{description}</p> : null}</div><IconButton label="Close modal" onClick={onClose}><Icon className="size-5" name="close"/></IconButton></div><div className="mt-6">{children}</div></div></div>;
}

export function Drawer({ open, onClose, title, children, side = "right" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; side?: "left" | "right" }) {
  useDismiss(open, onClose);
  if (!open) return null;
  return <div aria-modal="true" className="fixed inset-0 z-50 bg-coop/60" onMouseDown={(event) => event.currentTarget === event.target && onClose()} role="dialog"><div className={cn("absolute inset-y-0 w-[min(90vw,24rem)] overflow-y-auto bg-eggshell p-5 shadow-crate", side === "right" ? "right-0" : "left-0")}><div className="flex items-center justify-between gap-4"><h2 className="font-display text-xl font-bold text-coop">{title}</h2><IconButton label="Close drawer" onClick={onClose}><Icon className="size-5" name="close"/></IconButton></div><div className="mt-6">{children}</div></div></div>;
}
