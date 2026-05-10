import type { LineItem } from "./schema";

export type LineComputed = LineItem & {
  taxableValue: number;
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

function lineTaxable(line: LineItem): number {
  const disc = line.discount ?? 0;
  return Math.max(0, line.quantity * line.rate - disc);
}

export function computeLineItems(lineItems: LineItem[]): LineComputed[] {
  return lineItems.map((line) => ({
    ...line,
    taxableValue: Math.round(lineTaxable(line) * 100) / 100,
  }));
}

export function computeInvoiceTotals(
  lineItems: LineItem[],
  taxMode: "IGST" | "CGST_SGST",
  gstPercent: number,
  extraCharges = 0,
  roundOff = 0,
): InvoiceTotals {
  const lines = computeLineItems(lineItems);
  const subtotalTaxable = lines.reduce((s, l) => s + l.taxableValue, 0);
  const extra = Math.round(extraCharges * 100) / 100;
  const taxableBase = Math.round((subtotalTaxable + extra) * 100) / 100;
  const p = gstPercent / 100;
  let igst = 0;
  let cgst = 0;
  let sgst = 0;
  if (taxMode === "IGST") {
    igst = Math.round(taxableBase * p * 100) / 100;
  } else {
    const half = Math.round(taxableBase * (p / 2) * 100) / 100;
    cgst = half;
    sgst = half;
  }
  const totalTax = Math.round((igst + cgst + sgst) * 100) / 100;
  const preRound = taxableBase + totalTax;
  const ro = Math.round((roundOff ?? 0) * 100) / 100;
  const grandTotal = Math.round((preRound + ro) * 100) / 100;

  const byHsn = new Map<string, number>();
  for (const l of lines) {
    byHsn.set(l.hsn, (byHsn.get(l.hsn) ?? 0) + l.taxableValue);
  }
  const hsnSummary: HsnTaxRow[] = [];
  for (const [hsn, taxableValue] of byHsn) {
    const tv = Math.round(taxableValue * 100) / 100;
    let rowIgst = 0;
    let rowCgst = 0;
    let rowSgst = 0;
    if (taxMode === "IGST") {
      rowIgst = Math.round(tv * p * 100) / 100;
    } else {
      rowCgst = Math.round(tv * (p / 2) * 100) / 100;
      rowSgst = rowCgst;
    }
    hsnSummary.push({
      hsn,
      taxableValue: tv,
      taxRatePercent: gstPercent,
      igstAmount: rowIgst,
      cgstAmount: rowCgst,
      sgstAmount: rowSgst,
    });
  }
  hsnSummary.sort((a, b) => a.hsn.localeCompare(b.hsn));

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
