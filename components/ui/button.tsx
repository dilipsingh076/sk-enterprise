import * as React from "react";
import { cn } from "@/components/ui/cn";

const variants = {
  primary:
    "rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-300",
  secondary:
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50",
  outline:
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50",
  danger:
    "rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50",
  ghost: "rounded p-1 text-xs text-red-600 hover:bg-red-50",
  nav: "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900",
  navActive: "bg-zinc-200 text-zinc-900 shadow-sm hover:bg-zinc-200",
  iconRow:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50",
  iconPrimary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800",
  /** Primary submit row (icon + label) */
  submit:
    "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 sm:w-auto",
} as const;

export type ButtonVariant = keyof typeof variants;

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", className, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(variants[variant], className)} {...props} />
  );
});
