import * as React from "react";
import { FormField, type FormFieldProps } from "@/components/ui/compounds/form-field";
import { TextArea, type TextAreaProps } from "@/components/ui/input";

export type TextAreaFieldProps = Omit<FormFieldProps, "children"> &
  Omit<TextAreaProps, "id"> & {
    id?: string;
  };

/** Textarea with label, validation error, and optional hint. */
export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
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
      ...textareaProps
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
        <TextArea ref={ref} id={inputId} {...textareaProps} />
      </FormField>
    );
  },
);
