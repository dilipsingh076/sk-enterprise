"use client";

import { formatInvoiceDate, parseInvoiceDateToIso } from "@/lib/invoice/formatInvoiceDate";
import { Input } from "@/components/ui";

type Props = {
  id?: string;
  value: string;
  onChange: (display: string) => void;
  onBlur?: () => void;
};

/** Date picker; form stores `31/May/2026` (same as PDF). */
export function InvoiceDateInput({ id, value, onChange, onBlur }: Props) {
  const stored = value.trim();
  const pickerValue = stored ? (parseInvoiceDateToIso(stored) ?? "") : "";

  return (
    <Input
      id={id}
      type="date"
      value={pickerValue}
      title={stored || undefined}
      onChange={(e) => {
        const iso = e.target.value;
        onChange(iso ? formatInvoiceDate(iso) : "");
      }}
      onBlur={onBlur}
    />
  );
}
