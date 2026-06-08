import * as React from "react";
import { Box } from "@/components/ui/box";
import { cn } from "@/components/ui/cn";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Grid } from "@/components/ui/stack";
import { Text } from "@/components/ui/typography";

export type FormFieldProps = {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  error?: string | null;
  hint?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
};

/** Label + control + error + hint (compound form field). */
export function FormField({
  label,
  htmlFor,
  required,
  optional,
  error,
  hint,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  const labelText =
    optional && typeof label === "string" ? (
      <>
        {label} <span className="font-normal text-zinc-400">(optional)</span>
      </>
    ) : (
      label
    );

  return (
    <Field className={className}>
      <Label htmlFor={htmlFor} required={required} className={labelClassName}>
        {labelText}
      </Label>
      {children}
      {error ? <Text className="mt-1 text-xs text-red-600">{error}</Text> : null}
      {hint ? (
        <Text caption className="mt-1 text-[10px] leading-snug text-zinc-500">
          {hint}
        </Text>
      ) : null}
    </Field>
  );
}

export type FormFieldGroupProps = {
  title?: React.ReactNode;
  className?: string;
  gridClassName?: string;
  bordered?: boolean;
  children: React.ReactNode;
};

/** Section title + responsive field grid. */
export function FormFieldGroup({
  title,
  className,
  gridClassName = "grid-cols-1 sm:grid-cols-2",
  bordered = false,
  children,
}: FormFieldGroupProps) {
  return (
    <Box
      className={cn(
        bordered && "mb-4 border-t border-zinc-100 pt-4",
        !bordered && "mb-4",
        className,
      )}
    >
      {title ? (
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </Text>
      ) : null}
      <Grid columns={gridClassName} gap="sm">
        {children}
      </Grid>
    </Box>
  );
}
