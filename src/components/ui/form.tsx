"use client";

import { useId, useState, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "./icons";

const control = "min-h-11 w-full rounded-control border border-coop/20 bg-white px-3 text-base text-coop outline-none placeholder:text-coop/40 focus:border-palm focus:ring-3 focus:ring-palm/15 disabled:cursor-not-allowed disabled:bg-coop/5 disabled:text-coop/50";

type FieldMeta = { label?: string; error?: string; hint?: string };

function FieldFrame({ id, label, error, hint, children }: FieldMeta & { id: string; children: React.ReactNode }) {
  return <div className="space-y-1.5">{label ? <label className="block text-sm font-semibold text-coop" htmlFor={id}>{label}</label> : null}{children}{error ? <p className="text-sm text-red-700" id={`${id}-error`}>{error}</p> : hint ? <p className="text-sm text-coop/60" id={`${id}-hint`}>{hint}</p> : null}</div>;
}

export function Input({ label, error, hint, className, id: givenId, ...props }: InputHTMLAttributes<HTMLInputElement> & FieldMeta) {
  const fallbackId = useId();
  const id = givenId ?? fallbackId;
  return <FieldFrame error={error} hint={hint} id={id} label={label}><input aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} aria-invalid={Boolean(error)} className={cn(control, error && "border-red-600 focus:border-red-700 focus:ring-red-100", className)} id={id} {...props} /></FieldFrame>;
}

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & FieldMeta) {
  const [visible, setVisible] = useState(false);
  const fallbackId = useId();
  const id = props.id ?? fallbackId;
  const { label, error, hint, className, ...inputProps } = props;
  return <FieldFrame error={error} hint={hint} id={id} label={label}><div className="relative"><input aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} aria-invalid={Boolean(error)} className={cn(control, "pr-12", error && "border-red-600", className)} id={id} type={visible ? "text" : "password"} {...inputProps} /><button aria-label={visible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-coop/60 hover:text-palm" onClick={() => setVisible((value) => !value)} type="button"><Icon className="size-5" name="eye" /></button></div></FieldFrame>;
}

export function Select({ label, error, hint, className, id: givenId, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & FieldMeta) {
  const fallbackId = useId();
  const id = givenId ?? fallbackId;
  return <FieldFrame error={error} hint={hint} id={id} label={label}><select aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} aria-invalid={Boolean(error)} className={cn(control, "appearance-none", className)} id={id} {...props}>{children}</select></FieldFrame>;
}

export function Textarea({ label, error, hint, className, id: givenId, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldMeta) {
  const fallbackId = useId();
  const id = givenId ?? fallbackId;
  return <FieldFrame error={error} hint={hint} id={id} label={label}><textarea aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} aria-invalid={Boolean(error)} className={cn(control, "min-h-28 resize-y py-3", className)} id={id} {...props} /></FieldFrame>;
}

export function Checkbox({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const fallbackId = useId();
  const id = props.id ?? fallbackId;
  return <label className="flex cursor-pointer items-start gap-3 text-sm text-coop" htmlFor={id}><input className={cn("mt-0.5 size-5 rounded border-coop/30 accent-palm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm", className)} id={id} type="checkbox" {...props} /><span>{label}</span></label>;
}

export function Radio({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const fallbackId = useId();
  const id = props.id ?? fallbackId;
  return <label className="flex cursor-pointer items-center gap-3 text-sm text-coop" htmlFor={id}><input className={cn("size-5 border-coop/30 accent-palm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm", className)} id={id} type="radio" {...props} /><span>{label}</span></label>;
}

export function FileUpload({ label = "Choose a file", hint, className, id: givenId, ...props }: InputHTMLAttributes<HTMLInputElement> & FieldMeta) {
  const fallbackId = useId();
  const id = givenId ?? fallbackId;
  return <FieldFrame hint={hint} id={id} label={label}><label className={cn("flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-coop/20 bg-eggshell/60 px-5 py-6 text-center transition hover:border-palm hover:bg-palm/5", className)} htmlFor={id}><Icon className="size-6 text-palm" name="upload"/><span className="text-sm font-semibold text-coop">Browse or drop a file here</span><input className="sr-only" id={id} type="file" {...props}/></label></FieldFrame>;
}
