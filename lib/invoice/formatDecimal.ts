import type { ChangeEvent, FormEvent } from "react";
import { roundTo2 } from "@/lib/invoice/calculations";

export const TWO_DECIMAL_MESSAGE = "Use at most 2 decimal places";

/** Indian-grouped number with exactly 2 decimal places. */
export function formatDecimal2(n: number): string {
  return roundTo2(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** True when the value has no more than two digits after the decimal point. */
export function hasAtMost2Decimals(n: number): boolean {
  if (!Number.isFinite(n)) return false;
  return Math.abs(n - roundTo2(n)) < 1e-9;
}

/** Block typing/pasting more than `maxDecimals` digits after the decimal point. */
export function clampDecimalInputString(raw: string, maxDecimals = 2): string {
  if (!raw) return raw;

  const sign = raw.startsWith("-") ? "-" : "";
  const unsigned = sign ? raw.slice(1) : raw;
  const dotIndex = unsigned.indexOf(".");
  if (dotIndex === -1) {
    const whole = unsigned.replace(/[^\d]/g, "");
    return `${sign}${whole}`;
  }

  const whole = unsigned.slice(0, dotIndex).replace(/[^\d]/g, "");
  const fraction = unsigned
    .slice(dotIndex + 1)
    .replace(/[^\d]/g, "")
    .slice(0, maxDecimals);
  return fraction.length > 0 ? `${sign}${whole}.${fraction}` : `${sign}${whole}.`;
}

export function parseTwoDecimalInput(v: string | number): number {
  if (v === "" || v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? roundTo2(n) : 0;
}

export function parseOptionalTwoDecimalInput(v: string | number): number | undefined {
  if (v === "" || v == null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? roundTo2(n) : undefined;
}

export const twoDecimalNumField = {
  valueAsNumber: true,
  setValueAs: parseTwoDecimalInput,
  validate: (value: unknown) =>
    typeof value !== "number" || hasAtMost2Decimals(value) || TWO_DECIMAL_MESSAGE,
} as const;

export const optionalTwoDecimalNumField = {
  valueAsNumber: true,
  setValueAs: parseOptionalTwoDecimalInput,
  validate: (value: unknown) =>
    value == null || typeof value !== "number" || hasAtMost2Decimals(value) || TWO_DECIMAL_MESSAGE,
} as const;

type RegisteredField = {
  name: string;
  onBlur: (e: ChangeEvent<HTMLInputElement>) => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  ref: (instance: HTMLInputElement | null) => void;
};

/** Clamp live input and wire react-hook-form change handlers. */
export function bindTwoDecimalInput(reg: RegisteredField, min?: number) {
  return {
    ...reg,
    step: "0.01" as const,
    inputMode: "decimal" as const,
    ...(min != null ? { min } : {}),
    onInput: (e: FormEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const clamped = clampDecimalInputString(input.value, 2);
      if (clamped !== input.value) input.value = clamped;
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const clamped = clampDecimalInputString(e.target.value, 2);
      if (clamped !== e.target.value) e.target.value = clamped;
      reg.onChange(e);
    },
  };
}
