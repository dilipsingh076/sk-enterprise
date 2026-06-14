import type { LineItem } from "./schema";

export function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Round to 2 decimal places (paise). */
export function roundTo2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(2));
}

/** Percent field: 0–100 inclusive, rounded to 2 decimal places. */
export function clampPercent(v: unknown): number {
  const n = toNum(v);
  if (n <= 0) return 0;
  if (n >= 100) return 100;
  return Math.round(n * 100) / 100;
}

/** Gross before discount: qty × rate (2 dp). */
export function lineGross(line: Pick<LineItem, "quantity" | "rate">): number {
  return roundTo2(roundTo2(toNum(line.quantity)) * roundTo2(toNum(line.rate)));
}

export function lineTaxPercent(line: LineItem, invoiceGstPercent: number): number {
  const p = line.taxPercent;
  if (p != null && Number.isFinite(Number(p))) return clampPercent(p);
  return clampPercent(invoiceGstPercent);
}

/** Discount in rupees for the line (amount or % of gross), capped at gross. */
export function lineDiscountRupees(line: LineItem): number {
  const gross = lineGross(line);
  const kind = line.discountKind ?? "AMOUNT";
  const disc = toNum(line.discount);
  if (kind === "PERCENT") {
    return Math.min(gross, Math.round((gross * (disc / 100)) * 100) / 100);
  }
  return Math.min(gross, Math.round(disc * 100) / 100);
}

export type LineComputed = LineItem & {
  /** Qty × rate (before discount). */
  grossAmount: number;
  /** Taxable after line discount. */
  taxableValue: number;
  /** GST on gross (qty × rate), per line. */
  taxAmount: number;
  /** Taxable + tax for the line. */
  lineTotal: number;
};

export type HsnTaxRow = {
  hsn: string;
  taxableValue: number;
  taxRatePercent: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
};

export type InvoiceTotals = {
  lines: LineComputed[];
  subtotalTaxable: number;
  extraCharges: number;
  taxableBase: number;
  gstPercent: number;
  taxMode: "IGST" | "CGST_SGST";
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  hsnSummary: HsnTaxRow[];
};

export function lineTaxableValue(line: LineItem): number {
  const gross = lineGross(line);
  const d = lineDiscountRupees(line);
  return Math.max(0, Math.round((gross - d) * 100) / 100);
}

/** GST on qty × rate for one line. */
export function lineTaxAmount(
  grossAmount: number,
  _taxMode: "IGST" | "CGST_SGST",
  taxPercent: number,
): number {
  const p = toNum(taxPercent) / 100;
  return Math.round(grossAmount * p * 100) / 100;
}

export function computeLineItems(
  lineItems: LineItem[],
  taxMode: "IGST" | "CGST_SGST",
  gstPercent: number,
): LineComputed[] {
  return lineItems.map((line) => {
    const grossAmount = lineGross(line);
    const taxableValue = lineTaxableValue(line);
    const pct = lineTaxPercent(line, gstPercent);
    const taxAmount = lineTaxAmount(taxableValue, taxMode, pct);
    const lineTotal = Math.round((taxableValue + taxAmount) * 100) / 100;
    return {
      ...line,
      taxPercent: pct,
      grossAmount,
      taxableValue,
      taxAmount,
      lineTotal,
    };
  });
}

/** Adjustment (₹) so taxable + tax rounds to the nearest whole rupee. */
export function autoRoundOffRupee(preRoundTotal: number): number {
  const pre = Math.round(preRoundTotal * 100) / 100;
  const nearestRupee = Math.round(pre);
  return Math.round((nearestRupee - pre) * 100) / 100;
}

export function computeInvoiceTotals(
  lineItems: LineItem[],
  taxMode: "IGST" | "CGST_SGST",
  gstPercent: number,
  extraCharges = 0,
): InvoiceTotals {
  const lines = computeLineItems(lineItems, taxMode, gstPercent);
  const subtotalTaxable = lines.reduce((s, l) => s + l.taxableValue, 0);
  const extra = Math.round(extraCharges * 100) / 100;
  const taxableBase = Math.round((subtotalTaxable + extra) * 100) / 100;
  let igst = 0;
  let cgst = 0;
  let sgst = 0;
  for (const l of lines) {
    const t = l.taxAmount;
    if (taxMode === "IGST") {
      igst += t;
    } else {
      // Intra-state: CGST and SGST each get half of the line GST (Indian GST rules).
      const half = Math.round((t / 2) * 100) / 100;
      cgst += half;
      sgst += Math.round((t - half) * 100) / 100;
    }
  }
  igst = Math.round(igst * 100) / 100;
  cgst = Math.round(cgst * 100) / 100;
  sgst = Math.round(sgst * 100) / 100;
  const totalTax = Math.round((igst + cgst + sgst) * 100) / 100;
  const preRound = Math.round((taxableBase + totalTax) * 100) / 100;
  const ro = autoRoundOffRupee(preRound);
  const grandTotal = Math.round((preRound + ro) * 100) / 100;

  const byHsnRate = new Map<
    string,
    { hsn: string; taxRatePercent: number; taxableValue: number; taxAmount: number }
  >();
  for (const l of lines) {
    const ratePct = lineTaxPercent(l, gstPercent);
    const key = `${l.hsn}\0${ratePct}`;
    const cur = byHsnRate.get(key) ?? {
      hsn: l.hsn,
      taxRatePercent: ratePct,
      taxableValue: 0,
      taxAmount: 0,
    };
    cur.taxableValue += l.taxableValue;
    cur.taxAmount += l.taxAmount;
    byHsnRate.set(key, cur);
  }
  const hsnSummary: HsnTaxRow[] = [];
  for (const agg of byHsnRate.values()) {
    const tv = Math.round(agg.taxableValue * 100) / 100;
    const lineTax = Math.round(agg.taxAmount * 100) / 100;
    let rowIgst = 0;
    let rowCgst = 0;
    let rowSgst = 0;
    if (taxMode === "IGST") {
      rowIgst = lineTax;
    } else {
      rowCgst = Math.round((lineTax / 2) * 100) / 100;
      rowSgst = Math.round((lineTax - rowCgst) * 100) / 100;
    }
    hsnSummary.push({
      hsn: agg.hsn,
      taxableValue: tv,
      taxRatePercent: agg.taxRatePercent,
      igstAmount: rowIgst,
      cgstAmount: rowCgst,
      sgstAmount: rowSgst,
    });
  }
  hsnSummary.sort(
    (a, b) => a.hsn.localeCompare(b.hsn) || a.taxRatePercent - b.taxRatePercent,
  );

  return {
    lines,
    subtotalTaxable: Math.round(subtotalTaxable * 100) / 100,
    extraCharges: extra,
    taxableBase,
    gstPercent,
    taxMode,
    igst,
    cgst,
    sgst,
    totalTax,
    roundOff: ro,
    grandTotal,
    hsnSummary,
  };
}
