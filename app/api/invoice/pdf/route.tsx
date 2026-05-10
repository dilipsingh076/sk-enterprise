import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { computeInvoiceTotals } from "@/lib/invoice/calculations";
import { getBrandingLogoDataUri } from "@/lib/pdf/brandingLogo";
import { InvoicePdfDocument } from "@/lib/pdf/InvoicePdfDocument";
import { amountInWordsInr } from "@/lib/invoice/words";
import { invoiceSchema, resolveInvoice } from "@/lib/invoice/schema";

export async function POST(req: Request) {
  const isPreview =
    req.headers.get("x-invoice-pdf-preview") === "1" ||
    req.headers.get("X-Invoice-Pdf-Preview") === "1";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const invoice = resolveInvoice(parsed.data);
  const totals = computeInvoiceTotals(
    invoice.lineItems,
    invoice.taxMode,
    invoice.gstPercent,
    invoice.extraCharges ?? 0,
    invoice.roundOff ?? 0,
  );
  const amountWords = amountInWordsInr(totals.grandTotal);
  const taxAmountWords = amountInWordsInr(totals.totalTax);

  const logoSrc = getBrandingLogoDataUri();

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      <InvoicePdfDocument
        invoice={invoice}
        totals={totals}
        amountWords={amountWords}
        taxAmountWords={taxAmountWords}
        logoSrc={logoSrc ?? undefined}
      />,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "PDF render failed";
    console.error("[invoice/pdf]", msg, e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }

  const safeNo = invoice.invoiceNumber.replace(/[^\w.\-]+/g, "_");
  const disposition = isPreview
    ? `inline; filename="Invoice-${safeNo}.pdf"`
    : `attachment; filename="Invoice-${safeNo}.pdf"`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
