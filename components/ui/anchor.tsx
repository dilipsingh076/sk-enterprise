import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Anchor = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(
  function Anchor({ className, ...props }, ref) {
    return <a ref={ref} className={cn(className)} {...props} />;
  },
);
