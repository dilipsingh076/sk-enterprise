import * as React from "react";
import { cn } from "@/components/ui/cn";
import { fieldLabelClass, fieldLabelInlineClass } from "@/components/ui/tokens";

export type LabelProps = React.ComponentPropsWithoutRef<"label"> & {
  /** Default block label; `inline` matches profile picker style */
  layout?: "block" | "inline";
};

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { layout = "block", className, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(layout === "inline" ? fieldLabelInlineClass : fieldLabelClass, className)}
      {...props}
    />
  );
});
