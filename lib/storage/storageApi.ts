"use client";

import type { InvoiceFormInput } from "@/lib/invoice/schema";
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

export async function saveProfileActiveCompanyId(id: string): Promise<void> {
  const bundle = await fetchProfileBundle();
  await saveProfileBundle({ ...bundle, activeCompanyId: id });
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
  return parseJson<BillRecord>(res);
}

export async function updateBill(id: string, invoice: InvoiceFormInput, title?: string): Promise<BillRecord> {
  const res = await fetch(`/api/storage/bills/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice, title }),
  });
  return parseJson<BillRecord>(res);
}

export async function deleteBill(id: string): Promise<void> {
  const res = await fetch(`/api/storage/bills/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
}
