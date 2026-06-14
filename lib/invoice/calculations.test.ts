import { describe, expect, it } from "vitest";
import {
  autoRoundOffRupee,
  computeInvoiceTotals,
  lineTaxableValue,
  roundTo2,
} from "./calculations";
import type { LineItem } from "./schema";

function line(overrides: Partial<LineItem> = {}): LineItem {
  return {
    description: "Item",
    hsn: "8471",
    quantity: 1,
    unit: "Nos",
    rate: 100,
    discount: 0,
    discountKind: "AMOUNT",
    taxPercent: 18,
    ...overrides,
  };
}

describe("roundTo2", () => {
  it("keeps two decimal places", () => {
    expect(roundTo2(1.234)).toBe(1.23);
    expect(roundTo2(1.235)).toBe(1.24);
    expect(roundTo2(10)).toBe(10);
  });
});

describe("autoRoundOffRupee", () => {
  it("rounds to nearest rupee", () => {
    expect(autoRoundOffRupee(100.49)).toBe(-0.49);
    expect(autoRoundOffRupee(100.5)).toBe(0.5);
    expect(autoRoundOffRupee(100.01)).toBe(-0.01);
  });
});

describe("computeInvoiceTotals", () => {
  it("splits CGST/SGST for intra-state", () => {
    const totals = computeInvoiceTotals([line({ rate: 1000, taxPercent: 18 })], "CGST_SGST", 18);
    expect(totals.cgst).toBe(90);
    expect(totals.sgst).toBe(90);
    expect(totals.igst).toBe(0);
    expect(totals.grandTotal).toBe(Math.round((totals.taxableBase + totals.totalTax + totals.roundOff) * 100) / 100);
  });

  it("uses IGST for inter-state", () => {
    const totals = computeInvoiceTotals([line({ rate: 1000, taxPercent: 18 })], "IGST", 18);
    expect(totals.igst).toBe(180);
    expect(totals.cgst).toBe(0);
    expect(totals.sgst).toBe(0);
  });

  it("ignores line discount when zero", () => {
    expect(lineTaxableValue(line({ rate: 500, discount: 0 }))).toBe(500);
  });
});
