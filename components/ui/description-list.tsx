import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Dl = React.forwardRef<HTMLDListElement, React.ComponentPropsWithoutRef<"dl">>(
  function Dl({ className, ...props }, ref) {
    return <dl ref={ref} className={cn(className)} {...props} />;
  },
);

export const Dt = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"dt">>(
  function Dt({ className, ...props }, ref) {
    return <dt ref={ref} className={cn(className)} {...props} />;
  },
);

export const Dd = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"dd">>(
  function Dd({ className, ...props }, ref) {
    return <dd ref={ref} className={cn(className)} {...props} />;
  },
);
