import * as React from "react";
import { FormField, type FormFieldProps } from "@/components/ui/compounds/form-field";
import { Input, type InputProps } from "@/components/ui/input";

export type TextFieldProps = Omit<FormFieldProps, "children"> &
  Omit<InputProps, "id"> & {
    id?: string;
  };

/** Text input with label, validation error, and optional hint. */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    htmlFor,
    required,
    optional,
    error,
    hint,
    className,
    labelClassName,
    id,
    ...inputProps
  },
  ref,
) {
  const inputId = id ?? htmlFor;
  return (
    <FormField
      label={label}
      htmlFor={inputId}
      required={required}
      optional={optional}
      error={error}
      hint={hint}
      className={className}
      labelClassName={labelClassName}
    >
      <Input ref={ref} id={inputId} {...inputProps} />
    </FormField>
  );
});
