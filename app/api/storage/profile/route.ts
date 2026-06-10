import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ensureUserProfileDefaults,
  normalizeStoredUserProfile,
} from "@/lib/profile/profileStorage";
import { userProfileSchema } from "@/lib/invoice/userProfile";
import { profileBundleSchema, readProfileBundle, writeProfileBundle } from "@/lib/storage/serverJsonStore";

export async function GET() {
  try {
    const bundle = await readProfileBundle();
    return NextResponse.json(bundle);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Failed to read profile";
    return NextResponse.json({ message }, { status: 500 });
  }
}

function profileValidationMessage(e: ZodError): string {
  const first = e.issues[0];
  if (!first) return "Invalid profile payload";
  const path = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
  return `${path}${first.message}`;
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      version?: number;
      userProfile?: unknown;
      activeCompanyId?: string;
    };
    const rawProfile = body.userProfile ?? {};
    const parsedProfile = userProfileSchema.safeParse(rawProfile);
    const userProfile = ensureUserProfileDefaults(
      parsedProfile.success ? parsedProfile.data : normalizeStoredUserProfile(rawProfile),
    );
    const bundle = profileBundleSchema.parse({
      version: body.version ?? 1,
      userProfile,
      activeCompanyId: body.activeCompanyId,
    });
    await writeProfileBundle(bundle);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    if (e instanceof ZodError) {
      return NextResponse.json({ message: profileValidationMessage(e) }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
