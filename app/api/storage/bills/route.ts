import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { invoiceSchema } from "@/lib/invoice/schema";
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
    const file = await readBillsFile();
    file.bills.unshift(record);
    await writeBillsFile(file);
    return NextResponse.json(record);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid bill payload" }, { status: 400 });
  }
}
