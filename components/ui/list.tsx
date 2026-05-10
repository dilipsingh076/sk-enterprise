import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Ul = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<"ul">>(
  function Ul({ className, ...props }, ref) {
    return <ul ref={ref} className={cn(className)} {...props} />;
  },
);

export const Ol = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  function Ol({ className, ...props }, ref) {
    return <ol ref={ref} className={cn(className)} {...props} />;
  },
);

export const Li = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  function Li({ className, ...props }, ref) {
    return <li ref={ref} className={cn(className)} {...props} />;
  },
);
