import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Form = React.forwardRef<HTMLFormElement, React.ComponentPropsWithoutRef<"form">>(
  function Form({ className, ...props }, ref) {
    return <form ref={ref} className={cn(className)} {...props} />;
  },
);
