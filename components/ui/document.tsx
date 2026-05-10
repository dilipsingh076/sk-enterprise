import * as React from "react";
import { cn } from "@/components/ui/cn";

/** Root `<html>` — use only in `app/layout.tsx`. */
export function RootHtml({ className, ...rest }: React.ComponentPropsWithoutRef<"html">) {
  return <html {...rest} className={cn(className)} />;
}

/** Root `<body>` — use only in `app/layout.tsx`. */
export function RootBody({ className, ...rest }: React.ComponentPropsWithoutRef<"body">) {
  return <body {...rest} className={cn(className)} />;
}
