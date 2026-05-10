import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Table = React.forwardRef<HTMLTableElement, React.ComponentPropsWithoutRef<"table">>(
  function Table({ className, ...props }, ref) {
    return <table ref={ref} className={cn(className)} {...props} />;
  },
);

export const Thead = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<"thead">
>(function Thead({ className, ...props }, ref) {
  return <thead ref={ref} className={cn(className)} {...props} />;
});

export const Tbody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<"tbody">
>(function Tbody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn(className)} {...props} />;
});

export const Tr = React.forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<"tr">>(
  function Tr({ className, ...props }, ref) {
    return <tr ref={ref} className={cn(className)} {...props} />;
  },
);

export const Th = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<"th">>(
  function Th({ className, ...props }, ref) {
    return <th ref={ref} className={cn(className)} {...props} />;
  },
);

export const Td = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<"td">>(
  function Td({ className, ...props }, ref) {
    return <td ref={ref} className={cn(className)} {...props} />;
  },
);
