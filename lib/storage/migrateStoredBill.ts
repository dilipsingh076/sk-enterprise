import { normalizeLoadedInvoiceForm } from "@/components/invoice/defaultValues";
import { prepareInvoicePayload } from "@/lib/invoice/billTaxDefaults";
import { roundTo2 } from "@/lib/invoice/calculations";
import { normalizeInvoiceDateStorage } from "@/lib/invoice/formatInvoiceDate";
import { invoiceSchema, type InvoiceFormInput } from "@/lib/invoice/schema";
import {
  billRecordSchema,
  type BillRecord,
  type BillsFile,
} from "@/lib/storage/billSchemas";

function fixPincode(value: unknown): string {
  const s = String(value ?? "").trim();
  return /^\d{6}$/.test(s) ? s : "000000";
}

function normalizePartyRaw(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const p = { ...(raw as Record<string, unknown>) };
  return {
    ...p,
    pincode: fixPincode(p.pincode),
    pan: p.pan ?? "",
    city: p.city ?? "",
    mobile: p.mobile ?? "",
    kindAttn: p.kindAttn ?? "",
  };
}

/** Patch older saved invoices so they validate under the current schema. */
export function preprocessStoredInvoiceRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const inv = { ...(raw as Record<string, unknown>) };

  const billTo = normalizePartyRaw(inv.billTo);
  if (billTo) inv.billTo = billTo;

  const purchaser =
    typeof inv.purchaserName === "string" ? inv.purchaserName.trim() : "";
  if (!purchaser) {
    if (typeof inv.paymentTerms === "string" && inv.paymentTerms.trim()) {
      inv.purchaserName = inv.paymentTerms.trim();
    } else if (billTo && typeof billTo.name === "string" && billTo.name.trim()) {
      inv.purchaserName = billTo.name.trim();
    }
  }

  delete inv.paymentTerms;
  delete inv.freightPaymentTerms;
  delete inv.insuranceTerms;
  delete inv.machineSerialNo;

  if (inv.shipTo) {
    const shipTo = normalizePartyRaw(inv.shipTo);
    if (shipTo) inv.shipTo = shipTo;
  }

  if (!inv.eInvoice || typeof inv.eInvoice !== "object") {
    inv.eInvoice = { irn: "", ackNumber: "", ackDate: "", qrImageBase64: "" };
  }

  if (Array.isArray(inv.lineItems)) {
    inv.lineItems = inv.lineItems.map((line) => {
      if (!line || typeof line !== "object") return line;
      const l = line as Record<string, unknown>;
      return {
        ...l,
        quantity: roundTo2(Number(l.quantity) || 0),
        rate: roundTo2(Number(l.rate) || 0),
        discountKind: l.discountKind === "PERCENT" ? "PERCENT" : "AMOUNT",
        discount: roundTo2(Number(l.discount ?? 0)),
      };
    });
  }

  inv.reverseCharge = Boolean(inv.reverseCharge);
  inv.shipSameAsBill = inv.shipSameAsBill !== false;
  inv.extraCharges = roundTo2(Number(inv.extraCharges ?? 0));
  inv.extraChargesLabel = inv.extraChargesLabel ?? "Other charges";
  inv.roundOff = roundTo2(Number(inv.roundOff ?? 0));

  if (typeof inv.invoiceDate === "string") {
    inv.invoiceDate = normalizeInvoiceDateStorage(inv.invoiceDate);
  }
  if (typeof inv.purchaseOrderDate === "string") {
    inv.purchaseOrderDate = normalizeInvoiceDateStorage(inv.purchaseOrderDate);
  }

  return inv;
}

export function migrateStoredInvoice(raw: unknown): InvoiceFormInput | null {
  const prepped = preprocessStoredInvoiceRaw(raw);
  const direct = invoiceSchema.safeParse(prepped);
  if (direct.success) {
    return prepareInvoicePayload(normalizeLoadedInvoiceForm(direct.data));
  }
  return null;
}

export function recoverBillRecord(entry: unknown): BillRecord | null {
  if (!entry || typeof entry !== "object") return null;
  const o = entry as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const createdAt = typeof o.createdAt === "string" ? o.createdAt : "";
  const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : createdAt;
  if (!id || !createdAt || o.invoice == null) return null;

  const title = typeof o.title === "string" ? o.title : undefined;
  const invoice = migrateStoredInvoice(o.invoice);
  if (!invoice) return null;

  const record = billRecordSchema.safeParse({
    id,
    createdAt,
    updatedAt,
    title,
    invoice,
  });
  return record.success ? record.data : null;
}

/** When strict parse fails, recover each bill instead of returning an empty list. */
export function recoverBillsFileFromRaw(raw: unknown): BillsFile {
  if (!raw || typeof raw !== "object") return { version: 1, bills: [] };
  const billsRaw = (raw as { bills?: unknown }).bills;
  if (!Array.isArray(billsRaw)) return { version: 1, bills: [] };

  const bills: BillRecord[] = [];
  for (const entry of billsRaw) {
    const rec = recoverBillRecord(entry);
    if (rec) bills.push(rec);
  }
  return { version: 1, bills };
}
