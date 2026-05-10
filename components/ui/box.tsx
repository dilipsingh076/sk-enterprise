import * as React from "react";
import { cn } from "@/components/ui/cn";

export type BoxProps = React.ComponentPropsWithoutRef<"div">;

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(function Box(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn(className)} {...props} />;
});
