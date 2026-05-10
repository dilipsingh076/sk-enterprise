import * as React from "react";
import { cn } from "@/components/ui/cn";

export type BannerTone = "error" | "success" | "warning" | "neutral";

const toneClass: Record<BannerTone, string> = {
  error: "border-red-200 bg-red-50 text-red-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-900",
};

export type BannerProps = React.ComponentPropsWithoutRef<"div"> & {
  tone?: BannerTone;
  role?: "alert" | "status" | "none";
};

export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(function Banner(
  { tone = "neutral", role = "none", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role={role === "none" ? undefined : role}
      className={cn("rounded-lg border px-3 py-2 text-sm", toneClass[tone], className)}
      {...props}
    />
  );
});
