import Link from "next/link";
import * as React from "react";
import type { LinkProps } from "next/link";
import { cn } from "@/components/ui/cn";

export type AppLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>;

export const AppLink = React.forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { className, ...props },
  ref,
) {
  return <Link ref={ref} className={cn(className)} {...props} />;
});
