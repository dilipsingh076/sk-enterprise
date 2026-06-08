import { get } from "react-hook-form";
import type { FieldErrors, FieldValues, Path } from "react-hook-form";

/** Show Zod/RHF messages only after touch or submit attempt. */
export function visibleFieldError<T extends FieldValues>(
  errors: FieldErrors<T>,
  touchedFields: Partial<Record<Path<T>, boolean | object>>,
  isSubmitted: boolean,
  name: Path<T>,
): string | undefined {
  if (!isSubmitted && !get(touchedFields, name)) return undefined;
  const msg = get(errors, name)?.message;
  return typeof msg === "string" ? msg : undefined;
}
