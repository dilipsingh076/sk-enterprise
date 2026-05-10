import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Details = React.forwardRef<HTMLDetailsElement, React.ComponentPropsWithoutRef<"details">>(
  function Details({ className, ...props }, ref) {
    return <details ref={ref} className={cn(className)} {...props} />;
  },
);

export const Summary = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"summary">>(
  function Summary({ className, ...props }, ref) {
    return <summary ref={ref} className={cn(className)} {...props} />;
  },
);
