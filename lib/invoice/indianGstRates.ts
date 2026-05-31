import { clampPercent } from "@/lib/invoice/calculations";

/**
 * Standard GST rate slabs used on Indian tax invoices (IGST or CGST+SGST combined %).
 * @see GST Council rate structure; special rates for bullion, diamonds, etc.
 */
export const INDIAN_GST_RATE_OPTIONS = [
  { value: 0, label: "0% — Nil / exempt" },
  { value: 0.25, label: "0.25% — Cut & polished diamonds" },
  { value: 3, label: "3% — Gold, precious metals" },
  { value: 5, label: "5%" },
  { value: 12, label: "12%" },
  { value: 18, label: "18% — Standard" },
  { value: 28, label: "28%" },
  { value: 40, label: "40% — With compensation cess" },
] as const;

export const INDIAN_GST_RATE_VALUES: readonly number[] = INDIAN_GST_RATE_OPTIONS.map(
  (o) => o.value,
);

export const DEFAULT_INDIAN_GST_RATE = 18;

function ratesEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.001;
}

export function isIndianGstRate(value: number): boolean {
  return INDIAN_GST_RATE_VALUES.some((r) => ratesEqual(r, value));
}

/** Map stored / typed % to a valid slab (for legacy bills and free-text input). */
export function coerceIndianGstRate(
  value: unknown,
  fallback: number = DEFAULT_INDIAN_GST_RATE,
): number {
  const n = clampPercent(value);
  const match = INDIAN_GST_RATE_VALUES.find((r) => ratesEqual(r, n));
  if (match !== undefined) return match;
  const fb = clampPercent(fallback);
  const fbMatch = INDIAN_GST_RATE_VALUES.find((r) => ratesEqual(r, fb));
  return fbMatch ?? DEFAULT_INDIAN_GST_RATE;
}

export function formatIndianGstRateOption(value: number): string {
  const opt = INDIAN_GST_RATE_OPTIONS.find((o) => ratesEqual(o.value, value));
  return opt?.label ?? `${value}%`;
}

export function gstRateSelectValue(value: unknown, fallback: number): string {
  return String(coerceIndianGstRate(value, fallback));
}
