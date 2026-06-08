import { describe, expect, it } from "vitest";
import {
  formatInvoiceDate,
  normalizeInvoiceDateStorage,
  parseInvoiceDateToIso,
} from "./formatInvoiceDate";

describe("formatInvoiceDate", () => {
  it("formats ISO with 3-letter month", () => {
    expect(formatInvoiceDate("2026-05-31")).toBe("31/May/2026");
    expect(formatInvoiceDate("2026-09-15")).toBe("15/Sep/2026");
  });
});

describe("normalizeInvoiceDateStorage", () => {
  it("converts ISO to display for storage", () => {
    expect(normalizeInvoiceDateStorage("2026-05-31")).toBe("31/May/2026");
  });

  it("keeps display format", () => {
    expect(normalizeInvoiceDateStorage("31/May/2026")).toBe("31/May/2026");
  });
});

describe("parseInvoiceDateToIso", () => {
  it("parses 3-letter month", () => {
    expect(parseInvoiceDateToIso("31/May/2026")).toBe("2026-05-31");
    expect(parseInvoiceDateToIso("15/Sep/2026")).toBe("2026-09-15");
  });

  it("parses numeric dd/mm/yyyy", () => {
    expect(parseInvoiceDateToIso("31/05/2026")).toBe("2026-05-31");
  });
});
