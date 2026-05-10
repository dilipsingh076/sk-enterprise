import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Span = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  function Span({ className, ...props }, ref) {
    return <span ref={ref} className={cn(className)} {...props} />;
  },
);

export type TextProps = React.ComponentPropsWithoutRef<"p"> & {
  muted?: boolean;
  caption?: boolean;
};

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(function Text(
  { muted, caption, className, ...props },
  ref,
) {
  return (
    <p
      ref={ref}
      className={cn(
        "text-sm text-zinc-800",
        muted && "text-zinc-600",
        caption && "text-[11px] leading-snug text-zinc-500",
        className,
      )}
      {...props}
    />
  );
});

export type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
} & React.HTMLAttributes<HTMLHeadingElement>;

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 1, className, ...props },
  ref,
) {
  const tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return React.createElement(tag, { ref, className: cn(className), ...props });
});

export const Strong = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"strong">>(
  function Strong({ className, ...props }, ref) {
    return <strong ref={ref} className={cn(className)} {...props} />;
  },
);

export const Code = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"code">>(
  function Code({ className, ...props }, ref) {
    return <code ref={ref} className={cn(className)} {...props} />;
  },
);

export const Kbd = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"kbd">>(
  function Kbd({ className, ...props }, ref) {
    return <kbd ref={ref} className={cn(className)} {...props} />;
  },
);
