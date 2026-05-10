import * as React from "react";
import { cn } from "@/components/ui/cn";

/** Screen-reader-only text (Tailwind `sr-only`). */
export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(function VisuallyHidden({ className, ...props }, ref) {
  return <span ref={ref} className={cn("sr-only", className)} {...props} />;
});
