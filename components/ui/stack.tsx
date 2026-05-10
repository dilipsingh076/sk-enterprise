import * as React from "react";
import { cn } from "@/components/ui/cn";

type Gap = "none" | "xs" | "sm" | "md" | "lg";

const gapClass: Record<Gap, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
};

export type StackProps = React.ComponentPropsWithoutRef<"div"> & {
  gap?: Gap;
};

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(function Stack(
  { gap = "md", className, ...props },
  ref,
) {
  return <div ref={ref} className={cn("flex flex-col", gapClass[gap], className)} {...props} />;
});

export type RowProps = React.ComponentPropsWithoutRef<"div"> & {
  gap?: Gap;
  wrap?: boolean;
};

export const Row = React.forwardRef<HTMLDivElement, RowProps>(function Row(
  { gap = "sm", wrap = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-row items-center", gapClass[gap], wrap && "flex-wrap", className)}
      {...props}
    />
  );
});

export type GridProps = React.ComponentPropsWithoutRef<"div"> & {
  gap?: Gap;
  /** Tailwind column classes, e.g. `sm:grid-cols-2 lg:grid-cols-4` */
  columns?: string;
};

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  { gap = "sm", columns = "grid-cols-1", className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("grid", gapClass[gap], columns, className)} {...props} />
  );
});
