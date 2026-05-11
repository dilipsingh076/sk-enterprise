import fs from "fs/promises";
import path from "path";
import { get, put } from "@vercel/blob";
import { z } from "zod";
import { invoiceSchema } from "@/lib/invoice/schema";
import { userProfileSchema } from "@/lib/invoice/userProfile";
import {
  DEFAULT_USER_PROFILE,
  ensureUserProfileDefaults,
  normalizeStoredUserProfile,
} from "@/lib/profile/profileStorage";

const BLOB_PREFIX = "e-bill-data";
const FILE_PROFILE = "profile.json";
const FILE_DRAFT = "draft.json";
const FILE_BILLS = "bills.json";

function blobStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function blobToken(): string {
  const t = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!t) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
  }
  return t;
}

function blobPath(name: string): string {
  return `${BLOB_PREFIX}/${name}`;
}

function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

/**
 * Must match the Blob store access in Vercel (Storage → your store).
 * Defaults to `private` (Vercel’s default for new stores). Set `BLOB_STORE_ACCESS=public` if the store is public.
 */
function blobStoreAccess(): "public" | "private" {
  const raw = process.env.BLOB_STORE_ACCESS?.trim().toLowerCase();
  if (raw === "public") return "public";
  return "private";
}

/** Read JSON from Vercel Blob via SDK `get` (works for private stores with the read/write token). */
async function readJsonBlob(name: string): Promise<unknown | null> {
  const pathname = blobPath(name);
  const token = blobToken();
  const access = blobStoreAccess();
  const result = await get(pathname, { access, token });
  if (!result) return null;
  if (result.statusCode === 304 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as unknown;
}

async function writeJsonBlob(name: string, data: unknown): Promise<void> {
  const pathname = blobPath(name);
  await put(pathname, JSON.stringify(data, null, 2), {
    access: blobStoreAccess(),
    token: blobToken(),
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

function dataDir(): string {
  return path.join(process.cwd(), "data");
}

async function readJsonFs(name: string): Promise<unknown | null> {
  const fp = path.join(dataDir(), name);
  try {
    const raw = await fs.readFile(fp, "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function writeJsonFs(name: string, data: unknown): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  const fp = path.join(dataDir(), name);
  await fs.writeFile(fp, JSON.stringify(data, null, 2), "utf8");
}

async function readJson(name: string): Promise<unknown | null> {
  if (blobStorageEnabled()) {
    return readJsonBlob(name);
  }
  return readJsonFs(name);
}

async function writeJson(name: string, data: unknown): Promise<void> {
  if (blobStorageEnabled()) {
    await writeJsonBlob(name, data);
    return;
  }
  if (isVercel()) {
    throw new Error(
      "On Vercel, set BLOB_READ_WRITE_TOKEN (Vercel Blob read/write token) so storage uses Blob only.",
    );
  }
  await writeJsonFs(name, data);
}

export const profileBundleSchema = z.object({
  version: z.literal(1),
  userProfile: userProfileSchema,
  activeCompanyId: z.string().optional(),
});

export type ProfileBundle = z.infer<typeof profileBundleSchema>;

export const billRecordSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  /** Short label for list (e.g. invoice no. + buyer) */
  title: z.string().optional(),
  invoice: invoiceSchema,
});

export type BillRecord = z.infer<typeof billRecordSchema>;

const billsFileSchema = z.object({
  version: z.literal(1),
  bills: z.array(billRecordSchema),
});

export type BillsFile = z.infer<typeof billsFileSchema>;

export function defaultProfileBundle(): ProfileBundle {
  const userProfile = ensureUserProfileDefaults(DEFAULT_USER_PROFILE);
  return {
    version: 1,
    userProfile,
    activeCompanyId: userProfile.defaultCompanyId,
  };
}

export async function readProfileBundle(): Promise<ProfileBundle> {
  const raw = await readJson(FILE_PROFILE);
  if (raw == null) return defaultProfileBundle();
  const parsed = profileBundleSchema.safeParse(raw);
  if (parsed.success) {
    return {
      ...parsed.data,
      userProfile: ensureUserProfileDefaults(parsed.data.userProfile),
    };
  }
  const userProfile = normalizeStoredUserProfile(raw);
  return {
    version: 1,
    userProfile: ensureUserProfileDefaults(userProfile),
    activeCompanyId: userProfile.defaultCompanyId,
  };
}

export async function writeProfileBundle(bundle: ProfileBundle): Promise<void> {
  const parsed = profileBundleSchema.parse(bundle);
  await writeJson(FILE_PROFILE, parsed);
}

export async function readDraft(): Promise<unknown | null> {
  return readJson(FILE_DRAFT);
}

export async function writeDraft(draft: unknown): Promise<void> {
  await writeJson(FILE_DRAFT, draft);
}

export async function clearDraftFile(): Promise<void> {
  await writeJson(FILE_DRAFT, null);
}

export async function readBillsFile(): Promise<BillsFile> {
  const raw = await readJson(FILE_BILLS);
  const parsed = billsFileSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return { version: 1, bills: [] };
}

export async function writeBillsFile(file: BillsFile): Promise<void> {
  const parsed = billsFileSchema.parse(file);
  await writeJson(FILE_BILLS, parsed);
}
