import { NextResponse } from "next/server";
import { invoiceSchema } from "@/lib/invoice/schema";
import { clearDraftFile, readDraft, writeDraft } from "@/lib/storage/serverJsonStore";

export async function GET() {
  try {
    const raw = await readDraft();
    if (raw == null) {
      return NextResponse.json({ draft: null });
    }
    const parsed = invoiceSchema.safeParse(raw);
    return NextResponse.json({ draft: parsed.success ? parsed.data : null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to read draft" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const invoice = invoiceSchema.parse(body);
    await writeDraft(invoice);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid invoice draft" }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    await clearDraftFile();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to clear draft" }, { status: 500 });
  }
}
