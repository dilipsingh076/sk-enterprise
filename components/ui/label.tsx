import * as React from "react";
import { cn } from "@/components/ui/cn";
import { fieldLabelClass, fieldLabelInlineClass } from "@/components/ui/tokens";

export type LabelProps = React.ComponentPropsWithoutRef<"label"> & {
  /** Default block label; `inline` matches profile picker style */
  layout?: "block" | "inline";
  /** Shows a red asterisk after the label text */
  required?: boolean;
};

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { layout = "block", className, required, children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(
        layout === "inline" ? fieldLabelInlineClass : fieldLabelClass,
        required && "inline-flex items-center gap-1",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="font-semibold text-red-600" title="Required" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
});
