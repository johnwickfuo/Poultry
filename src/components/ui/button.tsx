import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "border-palm bg-palm text-white shadow-label hover:bg-coop focus-visible:outline-palm",
  secondary: "border-yolk bg-yolk text-coop shadow-label hover:bg-[#e4a52f] focus-visible:outline-yolk",
  outline: "border-coop/20 bg-white text-coop hover:border-palm hover:text-palm focus-visible:outline-palm",
  ghost: "border-transparent bg-transparent text-coop hover:bg-coop/5 focus-visible:outline-palm",
  danger: "border-red-700 bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export function buttonStyles({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn("inline-flex items-center justify-center gap-2 rounded-control border font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className);
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonStyles({ variant, size, className })} type={type} {...props} />;
}

export function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} className={cn("inline-flex size-11 items-center justify-center rounded-control border border-coop/15 bg-white text-coop transition hover:border-palm hover:text-palm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm", className)} type="button" {...props} />;
}
