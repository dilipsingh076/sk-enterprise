import { NextResponse } from "next/server";
import { profileBundleSchema, readProfileBundle, writeProfileBundle } from "@/lib/storage/serverJsonStore";

export async function GET() {
  try {
    const bundle = await readProfileBundle();
    return NextResponse.json(bundle);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to read profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const bundle = profileBundleSchema.parse(body);
    await writeProfileBundle(bundle);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid profile payload" }, { status: 400 });
  }
}
