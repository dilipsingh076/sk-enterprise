import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { invoiceSchema } from "@/lib/invoice/schema";
import { invoiceNumberTaken } from "@/lib/bills/invoiceNumberTaken";
import { billRecordSchema, readBillsFile, writeBillsFile } from "@/lib/storage/serverJsonStore";

export async function GET() {
  try {
    const file = await readBillsFile();
    return NextResponse.json({ bills: file.bills });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to read bills" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const invoice = invoiceSchema.parse(body.invoice);
    const file = await readBillsFile();
    if (invoiceNumberTaken(file, invoice.invoiceNumber, invoice.seller.gstin)) {
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
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      title,
      invoice,
    });
    file.bills.unshift(record);
    await writeBillsFile(file);
    return NextResponse.json(record);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid bill payload" }, { status: 400 });
  }
}
