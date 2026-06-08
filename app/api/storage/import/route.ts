import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureUserProfileDefaults,
  normalizeStoredUserProfile,
  resolveActiveCompanyId,
} from "@/lib/profile/profileStorage";
import { billsFileSchema } from "@/lib/storage/billSchemas";
import { recoverBillsFileFromRaw } from "@/lib/storage/migrateStoredBill";
import {
  profileBundleSchema,
  readBillsFile,
  writeBillsFile,
  writeDraft,
  writeProfileBundle,
} from "@/lib/storage/serverJsonStore";

const importBodySchema = z.object({
  mode: z.enum(["merge", "replace"]).default("merge"),
  data: z.object({
    profile: z.unknown().optional(),
    bills: z.unknown().optional(),
    draft: z.unknown().optional(),
  }),
});

async function importProfileFromRaw(raw: unknown): Promise<string | null> {
  const strict = profileBundleSchema.safeParse(raw);
  if (strict.success) {
    await writeProfileBundle({
      ...strict.data,
      userProfile: ensureUserProfileDefaults(strict.data.userProfile),
    });
    return "Profile imported.";
  }

  const row = raw as { userProfile?: unknown; activeCompanyId?: string };
  const profileSource = row.userProfile ?? raw;
  try {
    const userProfile = normalizeStoredUserProfile(profileSource);
    const activeCompanyId = resolveActiveCompanyId(
      userProfile,
      typeof row.activeCompanyId === "string" ? row.activeCompanyId : undefined,
    );
    await writeProfileBundle(
      profileBundleSchema.parse({
        version: 1,
        userProfile,
        activeCompanyId,
      }),
    );
    return "Profile imported (migrated from older format).";
  } catch {
    return "Profile skipped (unrecognized format).";
  }
}

export async function POST(req: Request) {
  try {
    const body = importBodySchema.parse(await req.json());
    const { mode, data } = body;
    const notes: string[] = [];

    if (data.profile != null) {
      const profileNote = await importProfileFromRaw(data.profile);
      if (profileNote) notes.push(profileNote);
    }

    if (data.bills != null) {
      const incomingStrict = billsFileSchema.safeParse(data.bills);
      const incoming = incomingStrict.success
        ? incomingStrict.data
        : recoverBillsFileFromRaw(data.bills);

      if (mode === "replace") {
        await writeBillsFile(incoming);
        notes.push(`Replaced bills (${incoming.bills.length} in backup).`);
      } else {
        const current = await readBillsFile();
        const byId = new Map(current.bills.map((b) => [b.id, b]));
        for (const b of incoming.bills) {
          byId.set(b.id, b);
        }
        const merged = [...byId.values()];
        await writeBillsFile({ version: 1, bills: merged });
        notes.push(`Merged bills (${merged.length} total).`);
      }
    }

    if (data.draft !== undefined) {
      await writeDraft(data.draft);
      notes.push(data.draft == null ? "Draft cleared." : "Draft imported.");
    }

    const bills = await readBillsFile();
    const summary =
      notes.length > 0 ? notes.join(" ") : mode === "replace" ? "Import replaced bills." : "Import merged.";
    return NextResponse.json({
      ok: true,
      billsCount: bills.bills.length,
      message: summary,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Import failed" },
      { status: 400 },
    );
  }
}
