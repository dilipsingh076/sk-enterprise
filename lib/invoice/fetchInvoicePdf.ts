import type { InvoiceFormInput } from "@/lib/invoice/schema";

export type InvoicePdfDisposition = "attachment" | "inline";

export async function fetchInvoicePdf(
  data: InvoiceFormInput,
  disposition: InvoicePdfDisposition,
): Promise<{ blob: Blob; filename: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (disposition === "inline") {
    headers["X-Invoice-Pdf-Preview"] = "1";
  }
  const res = await fetch("/api/invoice/pdf", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
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
  const filename = match?.[1] ?? `Invoice-${data.invoiceNumber}.pdf`;
  return { blob, filename };
}
