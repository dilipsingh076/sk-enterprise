import { NextResponse } from "next/server";
import { readBillsFile, readDraft, readProfileBundle } from "@/lib/storage/serverJsonStore";

export async function GET() {
  try {
    const [profile, bills, draft] = await Promise.all([
      readProfileBundle(),
      readBillsFile(),
      readDraft(),
    ]);
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      profile,
      bills,
      draft,
    };
    const body = JSON.stringify(payload, null, 2);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="e-bill-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Export failed" }, { status: 500 });
  }
}
