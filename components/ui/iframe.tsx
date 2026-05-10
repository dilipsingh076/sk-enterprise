import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Iframe = React.forwardRef<HTMLIFrameElement, React.ComponentPropsWithoutRef<"iframe">>(
  function Iframe({ className, ...props }, ref) {
    return <iframe ref={ref} className={cn(className)} {...props} />;
  },
);
