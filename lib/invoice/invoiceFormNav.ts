import type { FieldErrors } from "react-hook-form";
import type { InvoiceFormInput } from "@/lib/invoice/schema";

export const INVOICE_SECTION = {
  issuer: "section-issuer",
  invoice: "section-this-invoice",
  company: "section-your-company",
  transport: "section-transport",
  einvoice: "section-einvoice",
  tax: "section-tax-pos",
  billTo: "section-billto",
  shipTo: "section-shipto",
  lines: "section-lines",
  preview: "section-pdf-preview",
} as const;

export function scrollToInvoiceSection(sectionId: string) {
  if (typeof document === "undefined") return;
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** First section that has a blocking error (shallow scan). */
export function firstInvoiceErrorSectionId(errors: FieldErrors<InvoiceFormInput>): string | null {
  if (errors.invoiceNumber || errors.invoiceDate) return INVOICE_SECTION.invoice;
  if (errors.purchaserName || errors.poNumber || errors.purchaseOrderDate) return INVOICE_SECTION.billTo;
  if (errors.seller) return INVOICE_SECTION.company;
  if (
    errors.deliveryTermsLine ||
    errors.transport ||
    errors.lrNumberAndDate ||
    errors.vehicle ||
    errors.eWayBill ||
    errors.destination ||
    errors.otherMeta ||
    errors.hypothecation ||
    errors.deliveryNote
  ) {
    return INVOICE_SECTION.transport;
  }
  if (errors.eInvoice) return INVOICE_SECTION.einvoice;
  if (
    errors.placeOfSupplyState ||
    errors.placeOfSupplyCode ||
    errors.taxMode ||
    errors.gstPercent != null ||
    errors.reverseCharge != null ||
    errors.extraCharges != null ||
    errors.extraChargesLabel != null
  ) {
    return INVOICE_SECTION.tax;
  }
  if (errors.billTo) return INVOICE_SECTION.billTo;
  if (errors.shipTo || errors.shipSameAsBill) return INVOICE_SECTION.shipTo;
  if (errors.lineItems) return INVOICE_SECTION.lines;
  return null;
}
