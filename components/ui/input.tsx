import * as React from "react";
import { cn } from "@/components/ui/cn";
import { fieldInputClass } from "@/components/ui/tokens";

export type InputProps = React.ComponentPropsWithoutRef<"input">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(fieldInputClass, className)} {...props} />;
});

export type TextAreaProps = React.ComponentPropsWithoutRef<"textarea">;

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(fieldInputClass, className)} {...props} />;
});

export type CheckboxProps = Omit<React.ComponentPropsWithoutRef<"input">, "type">;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn("h-4 w-4 rounded border-zinc-400", className)}
      {...props}
    />
  );
});
