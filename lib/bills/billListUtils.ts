import type { BillRecord } from "@/lib/storage/billSchemas";

export type BillSortKey = "updated" | "invoice" | "buyer";

export function filterBills(bills: BillRecord[], query: string): BillRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return bills;
  return bills.filter((b) => {
    const inv = b.invoice;
    const hay = [
      b.title,
      inv.invoiceNumber,
      inv.billTo.name,
      inv.billTo.gstin,
      inv.seller.name,
      inv.seller.gstin,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function sortBills(bills: BillRecord[], key: BillSortKey): BillRecord[] {
  const copy = [...bills];
  copy.sort((a, b) => {
    if (key === "invoice") {
      return a.invoice.invoiceNumber.localeCompare(b.invoice.invoiceNumber);
    }
    if (key === "buyer") {
      return a.invoice.billTo.name.localeCompare(b.invoice.billTo.name);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  return copy;
}
