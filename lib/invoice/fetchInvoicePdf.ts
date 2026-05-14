import type { InvoiceFormInput } from "@/lib/invoice/schema";
import type { UserProfile } from "@/lib/invoice/userProfile";
import { ensureInvoiceNumberForSeller, ensureUserProfileDefaults } from "@/lib/profile/profileStorage";
import { fetchProfileBundle } from "@/lib/storage/storageApi";

export type InvoicePdfDisposition = "attachment" | "inline";

export type FetchInvoicePdfOptions = {
  /** When set, skips `fetchProfileBundle()` (PDF API uses request body only). */
  userProfile?: UserProfile;
};

export async function fetchInvoicePdf(
  data: InvoiceFormInput,
  disposition: InvoicePdfDisposition,
  options?: FetchInvoicePdfOptions,
): Promise<{ blob: Blob; filename: string }> {
  const profile = ensureUserProfileDefaults(
    options?.userProfile ?? (await fetchProfileBundle()).userProfile,
  );
  const invoiceNumber = ensureInvoiceNumberForSeller(data.invoiceNumber, profile, data.seller.gstin);
  const payload: InvoiceFormInput = { ...data, invoiceNumber };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (disposition === "inline") {
    headers["X-Invoice-Pdf-Preview"] = "1";
  }
  const res = await fetch("/api/invoice/pdf", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      typeof (err as { message?: unknown })?.message === "string"
        ? (err as { message: string }).message
        : "PDF generation failed";
    throw new Error(message);
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition");
  const match = cd?.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] ?? `Invoice-${payload.invoiceNumber}.pdf`;
  return { blob, filename };
}
