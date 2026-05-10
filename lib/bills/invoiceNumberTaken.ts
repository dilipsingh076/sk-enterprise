import type { BillsFile } from "@/lib/storage/serverJsonStore";

/**
 * True if another saved bill for the **same seller (company GSTIN)** already uses this
 * invoice number (case-insensitive, trimmed). Different companies may reuse the same
 * digits if their prefixes differ; same company cannot save the same number twice.
 */
export function invoiceNumberTaken(
  file: BillsFile,
  invoiceNumber: string,
  sellerGstin: string,
  excludeBillId?: string,
): boolean {
  const nKey = invoiceNumber.trim().toLowerCase();
  const gKey = sellerGstin.trim().toUpperCase();
  if (!nKey || !gKey) return false;
  return file.bills.some(
    (b) =>
      b.id !== excludeBillId &&
      b.invoice.seller.gstin.trim().toUpperCase() === gKey &&
      b.invoice.invoiceNumber.trim().toLowerCase() === nKey,
  );
}
