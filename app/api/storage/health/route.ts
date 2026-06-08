import { NextResponse } from "next/server";
import { getStorageHealth } from "@/lib/storage/storageHealth";

export async function GET() {
  try {
    const health = await getStorageHealth();
    return NextResponse.json(health, { status: health.ok ? 200 : 503 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: "Health check failed" },
      { status: 500 },
    );
  }
}
