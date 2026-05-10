"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BillRecord } from "@/lib/storage/serverJsonStore";
import { deleteBill, fetchBills } from "@/lib/storage/storageApi";

export function BillsListClient() {
  const [bills, setBills] = useState<BillRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchBills();
      setBills(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load bills");
      setBills([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this saved bill?")) return;
    setBusyId(id);
    try {
      await deleteBill(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-col gap-2 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Saved bills</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Stored in <code className="rounded bg-zinc-200 px-1 py-0.5 text-[11px]">data/bills.json</code>{" "}
            (local) or Vercel Blob in production.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Refresh
          </button>
          <Link
            href="/bill"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New invoice
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </div>
      )}

      {bills === null ? (
        <p className="text-sm text-zinc-600">Loading…</p>
      ) : bills.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-600">
          No bills yet. Download a PDF from the invoice page to save one here.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {bills.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-zinc-900">{b.title || b.invoice.invoiceNumber}</p>
                <p className="text-xs text-zinc-500">
                  Updated {new Date(b.updatedAt).toLocaleString()} · Invoice {b.invoice.invoiceNumber}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/bill?billId=${encodeURIComponent(b.id)}`}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={busyId === b.id}
                  onClick={() => void onDelete(b.id)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {busyId === b.id ? "…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
