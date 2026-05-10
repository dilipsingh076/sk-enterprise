import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Option = React.forwardRef<HTMLOptionElement, React.ComponentPropsWithoutRef<"option">>(
  function Option({ className, ...props }, ref) {
    return <option ref={ref} className={cn(className)} {...props} />;
  },
);

Option.displayName = "SelectOption";
