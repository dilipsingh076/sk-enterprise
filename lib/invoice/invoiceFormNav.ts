import type { FieldErrors } from "react-hook-form";
import type { InvoiceFormInput } from "@/lib/invoice/schema";

export const INVOICE_SECTION = {
  issuer: "section-issuer",
  invoice: "section-this-invoice",
  company: "section-your-company",
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
  if (errors.seller) return INVOICE_SECTION.company;
  if (
    errors.placeOfSupplyState ||
    errors.placeOfSupplyCode ||
    errors.taxMode ||
    errors.gstPercent != null ||
    errors.reverseCharge != null ||
    errors.extraCharges != null ||
    errors.extraChargesLabel != null ||
    errors.roundOff != null
  ) {
    return INVOICE_SECTION.tax;
  }
  if (errors.billTo) return INVOICE_SECTION.billTo;
  if (errors.shipTo || errors.shipSameAsBill) return INVOICE_SECTION.shipTo;
  if (errors.lineItems) return INVOICE_SECTION.lines;
  if (errors.eInvoice) return INVOICE_SECTION.preview;
  return null;
}
