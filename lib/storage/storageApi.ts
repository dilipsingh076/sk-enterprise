"use client";

import { formatInvoiceDate } from "@/lib/invoice/formatInvoiceDate";
import { partySchema, type InvoiceFormInput, type Party } from "@/lib/invoice/schema";
import type { UserProfile } from "@/lib/invoice/userProfile";
import { mergeRecentBillToUserProfile } from "@/lib/profile/recentBillTo";
import type { ProfileBundle, BillRecord } from "@/lib/storage/serverJsonStore";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = typeof (err as { message?: unknown }).message === "string" ? (err as { message: string }).message : res.statusText;
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export async function fetchProfileBundle(): Promise<ProfileBundle> {
  const res = await fetch("/api/storage/profile", { cache: "no-store" });
  return parseJson<ProfileBundle>(res);
}

export async function saveProfileBundle(bundle: ProfileBundle): Promise<void> {
  const res = await fetch("/api/storage/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof (err as { message?: unknown }).message === "string" ? (err as { message: string }).message : "Save failed");
  }
}

export async function fetchDraft(): Promise<InvoiceFormInput | null> {
  const res = await fetch("/api/storage/draft", { cache: "no-store" });
  const data = await parseJson<{ draft: InvoiceFormInput | null }>(res);
  return data.draft;
}

export async function saveDraft(draft: InvoiceFormInput): Promise<void> {
  const res = await fetch("/api/storage/draft", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error("Draft save failed");
}

export async function clearDraftRemote(): Promise<void> {
  const res = await fetch("/api/storage/draft", { method: "DELETE" });
  if (!res.ok) throw new Error("Draft clear failed");
}

export async function fetchBills(): Promise<BillRecord[]> {
  const res = await fetch("/api/storage/bills", { cache: "no-store" });
  const data = await parseJson<{ bills: BillRecord[] }>(res);
  return data.bills;
}

let billsListCache: { bills: BillRecord[]; fetchedAt: number } | null = null;
const BILLS_LIST_CACHE_MS = 25_000;

/** Same as {@link fetchBills} but reuses a short in-memory cache to avoid hammering `/api/storage/bills` (e.g. issuer + invoice no. checks). */
export async function fetchBillsCached(options?: { force?: boolean }): Promise<BillRecord[]> {
  if (!options?.force && billsListCache && Date.now() - billsListCache.fetchedAt < BILLS_LIST_CACHE_MS) {
    return billsListCache.bills;
  }
  const bills = await fetchBills();
  billsListCache = { bills, fetchedAt: Date.now() };
  return bills;
}

export function invalidateBillsListCache(): void {
  billsListCache = null;
}

export async function fetchBill(id: string): Promise<BillRecord> {
  const res = await fetch(`/api/storage/bills/${encodeURIComponent(id)}`, { cache: "no-store" });
  return parseJson<BillRecord>(res);
}

export async function createBill(invoice: InvoiceFormInput, title?: string): Promise<BillRecord> {
  const res = await fetch("/api/storage/bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice, title }),
  });
  const record = await parseJson<BillRecord>(res);
  invalidateBillsListCache();
  return record;
}

export async function updateBill(id: string, invoice: InvoiceFormInput, title?: string): Promise<BillRecord> {
  const res = await fetch(`/api/storage/bills/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice, title }),
  });
  const record = await parseJson<BillRecord>(res);
  invalidateBillsListCache();
  return record;
}

export async function deleteBill(id: string): Promise<void> {
  const res = await fetch(`/api/storage/bills/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  invalidateBillsListCache();
}

export async function duplicateBill(sourceId: string, invoiceNumber: string): Promise<BillRecord> {
  const source = await fetchBill(sourceId);
  const invoice = {
    ...source.invoice,
    invoiceNumber,
    invoiceDate: formatInvoiceDate(new Date().toISOString().slice(0, 10)),
  };
  const title = `${invoiceNumber} — ${source.invoice.billTo.name}`;
  return createBill(invoice, title);
}

export function downloadStorageExport(): void {
  window.location.assign("/api/storage/export");
}

function normalizeImportPayload(parsed: unknown): {
  profile?: unknown;
  bills?: unknown;
  draft?: unknown;
} {
  if (!parsed || typeof parsed !== "object") return {};
  const o = parsed as Record<string, unknown>;
  if (o.profile != null || o.bills != null || o.draft != null) {
    return { profile: o.profile, bills: o.bills, draft: o.draft };
  }
  const nested = o.data;
  if (nested && typeof nested === "object") {
    const d = nested as Record<string, unknown>;
    return { profile: d.profile, bills: d.bills, draft: d.draft };
  }
  return {};
}

export async function importStorageBackup(
  file: File,
  mode: "merge" | "replace",
): Promise<{ billsCount: number; message: string }> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  const data = normalizeImportPayload(parsed);
  const res = await fetch("/api/storage/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, data }),
  });
  const result = await parseJson<{ billsCount: number; message: string }>(res);
  invalidateBillsListCache();
  return result;
}

/**
 * Prepend bill-to to profile recents (dedupe by GSTIN, max 20).
 * Pass `currentBundle` when you already have profile + activeCompanyId (avoids GET).
 */
export async function pushRecentBillToParty(
  party: Party,
  currentBundle?: ProfileBundle,
): Promise<UserProfile> {
  const parsed = partySchema.safeParse(party);
  if (!parsed.success) throw new Error("Invalid bill-to for recents");
  const p = parsed.data;
  const bundle = currentBundle ?? (await fetchProfileBundle());
  const userProfile = mergeRecentBillToUserProfile(bundle.userProfile, p);
  await saveProfileBundle({ ...bundle, userProfile });
  return userProfile;
}
