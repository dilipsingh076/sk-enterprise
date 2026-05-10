import * as React from "react";
import { Box } from "@/components/ui/box";
import { cn } from "@/components/ui/cn";

/** Groups a label + control + optional hint/error for consistent spacing. */
export function Field({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <Box className={cn("min-w-0", className)}>{children}</Box>;
}
