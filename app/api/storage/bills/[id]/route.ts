import { NextResponse } from "next/server";
import { invoiceSchema } from "@/lib/invoice/schema";
import { invoiceNumberTaken } from "@/lib/bills/invoiceNumberTaken";
import { billRecordSchema, readBillsFile, writeBillsFile } from "@/lib/storage/serverJsonStore";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const file = await readBillsFile();
    const hit = file.bills.find((b) => b.id === id);
    if (!hit) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(hit);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to read bill" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const invoice = invoiceSchema.parse(body.invoice);
    const file = await readBillsFile();
    const idx = file.bills.findIndex((b) => b.id === id);
    if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (invoiceNumberTaken(file, invoice.invoiceNumber, invoice.seller.gstin, id)) {
      return NextResponse.json(
        {
          message:
            "This invoice number is already saved for this company. Use a different number or open the existing bill.",
        },
        { status: 409 },
      );
    }
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : `${invoice.invoiceNumber} — ${invoice.billTo.name}`;
    const now = new Date().toISOString();
    const record = billRecordSchema.parse({
      ...file.bills[idx],
      updatedAt: now,
      title,
      invoice,
    });
    file.bills[idx] = record;
    await writeBillsFile(file);
    return NextResponse.json(record);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid bill update" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const file = await readBillsFile();
    const next = file.bills.filter((b) => b.id !== id);
    if (next.length === file.bills.length) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    await writeBillsFile({ version: 1, bills: next });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
  }
}
