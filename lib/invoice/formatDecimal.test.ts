import { describe, expect, it } from "vitest";
import { lineItemSchema } from "./schema";
import {
  clampDecimalInputString,
  hasAtMost2Decimals,
  parseTwoDecimalInput,
  TWO_DECIMAL_MESSAGE,
} from "./formatDecimal";

describe("hasAtMost2Decimals", () => {
  it("accepts up to two decimal places", () => {
    expect(hasAtMost2Decimals(1)).toBe(true);
    expect(hasAtMost2Decimals(1.2)).toBe(true);
    expect(hasAtMost2Decimals(1.23)).toBe(true);
  });

  it("rejects more than two decimal places", () => {
    expect(hasAtMost2Decimals(1.234)).toBe(false);
    expect(hasAtMost2Decimals(0.001)).toBe(false);
  });
});

describe("clampDecimalInputString", () => {
  it("limits fractional digits while typing", () => {
    expect(clampDecimalInputString("12.345")).toBe("12.34");
    expect(clampDecimalInputString("0.999")).toBe("0.99");
    expect(clampDecimalInputString("5.")).toBe("5.");
    expect(clampDecimalInputString("5")).toBe("5");
  });
});

describe("parseTwoDecimalInput", () => {
  it("rounds parsed values to two decimals", () => {
    expect(parseTwoDecimalInput("1.234")).toBe(1.23);
    expect(parseTwoDecimalInput("10")).toBe(10);
  });
});

describe("lineItemSchema quantity", () => {
  it("rejects more than two decimal places on quantity", () => {
    const parsed = lineItemSchema.safeParse({
      description: "Item",
      hsn: "8471",
      quantity: 1.234,
      unit: "NOS",
      rate: 100,
      discountKind: "AMOUNT",
      discount: 0,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.message === TWO_DECIMAL_MESSAGE)).toBe(true);
    }
  });
});
