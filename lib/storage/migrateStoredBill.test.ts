import { describe, expect, it } from "vitest";
import {
  migrateStoredInvoice,
  preprocessStoredInvoiceRaw,
  recoverBillsFileFromRaw,
} from "./migrateStoredBill";

describe("preprocessStoredInvoiceRaw", () => {
  it("maps legacy paymentTerms to purchaserName", () => {
    const out = preprocessStoredInvoiceRaw({
      paymentTerms: "Acme Ltd",
      billTo: { pincode: "12" },
    }) as Record<string, unknown>;
    expect(out.purchaserName).toBe("Acme Ltd");
    expect(out.paymentTerms).toBeUndefined();
    expect((out.billTo as { pincode: string }).pincode).toBe("000000");
  });

  it("falls back purchaserName to billTo.name for older saved bills", () => {
    const out = preprocessStoredInvoiceRaw({
      billTo: { name: "Acme Corp", pincode: "248013" },
    }) as Record<string, unknown>;
    expect(out.purchaserName).toBe("Acme Corp");
  });

  it("drops removed meta fields", () => {
    const out = preprocessStoredInvoiceRaw({
      freightPaymentTerms: "x",
      insuranceTerms: "y",
      machineSerialNo: "z",
    }) as Record<string, unknown>;
    expect(out.freightPaymentTerms).toBeUndefined();
    expect(out.insuranceTerms).toBeUndefined();
    expect(out.machineSerialNo).toBeUndefined();
  });
});

describe("recoverBillsFileFromRaw", () => {
  it("returns empty file for invalid input", () => {
    expect(recoverBillsFileFromRaw(null)).toEqual({ version: 1, bills: [] });
  });

  it("skips bills that fail migration", () => {
    const file = recoverBillsFileFromRaw({
      version: 1,
      bills: [{ id: "a", createdAt: "2024-01-01", invoice: { bad: true } }],
    });
    expect(file.bills).toHaveLength(0);
  });
});

describe("migrateStoredInvoice", () => {
  it("returns null for unusable payloads", () => {
    expect(migrateStoredInvoice({})).toBeNull();
  });
});
