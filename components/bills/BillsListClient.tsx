"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterBills, sortBills, type BillSortKey } from "@/lib/bills/billListUtils";
import { groupBillsByCompany } from "@/lib/bills/groupBillsByCompany";
import type { UserProfile } from "@/lib/invoice/userProfile";
import type { BillRecord } from "@/lib/storage/serverJsonStore";
import {
  deleteBill,
  downloadStorageExport,
  duplicateBill,
  fetchBills,
  fetchProfileBundle,
  importStorageBackup,
} from "@/lib/storage/storageApi";
import { useToast } from "@/components/ui/toast";
import {
  AppLink,
  Banner,
  Button,
  Heading,
  Input,
  Li,
  Option,
  Row,
  Section,
  Select,
  Stack,
  Text,
  Ul,
} from "@/components/ui";

export function BillsListClient() {
  const { toast } = useToast();
  const [bills, setBills] = useState<BillRecord[] | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<BillSortKey>("updated");
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, bundle] = await Promise.all([fetchBills(), fetchProfileBundle()]);
      setBills(list);
      setProfile(bundle.userProfile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load bills");
      setBills([]);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (bills === null) return [];
    return sortBills(filterBills(bills, query), sortKey);
  }, [bills, query, sortKey]);

  const sections = useMemo(
    () => (bills === null ? [] : groupBillsByCompany(filtered, profile)),
    [bills, filtered, profile],
  );

  const onDelete = async (id: string) => {
    if (!confirm("Delete this saved bill?")) return;
    setBusyId(id);
    try {
      await deleteBill(id);
      toast("Bill deleted", "success");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      toast("Delete failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const onDuplicate = async (b: BillRecord) => {
    const prefix =
      profile?.companies.find((c) => c.seller.gstin === b.invoice.seller.gstin)
        ?.invoiceNumberPrefix ?? "INV";
    const tag =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase()
        : "COPY";
    const suggested = `${prefix}-COPY-${tag}`;
    const num = window.prompt("Invoice number for copy:", suggested);
    if (!num?.trim()) return;
    setBusyId(b.id);
    try {
      await duplicateBill(b.id, num.trim());
      toast("Bill duplicated", "success");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Duplicate failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setBusyId(null);
    }
  };

  const runImport = async (file: File, mode: "merge" | "replace") => {
    try {
      const result = await importStorageBackup(file, mode);
      toast(result.message, "success");
      setPendingImportFile(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Import failed", "error");
    }
  };

  return (
    <Stack gap="md" className="mx-auto w-full">
      <Row
        className="flex-col border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between"
        gap="sm"
      >
        <Stack gap="xs">
          <Heading level={1} className="text-xl font-semibold text-zinc-900">
            Saved bills
          </Heading>
          <Text muted>
            Grouped by issuing company. Use backup export/import to protect data across deploys.
          </Text>
        </Stack>
        <Row className="flex-wrap" gap="sm">
          <Button type="button" variant="outline" onClick={() => downloadStorageExport()}>
            Export backup
          </Button>
          <Button type="button" variant="outline" onClick={() => importRef.current?.click()}>
            Import backup
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPendingImportFile(f);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
          <AppLink
            href="/bill"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New invoice
          </AppLink>
        </Row>
      </Row>

      {bills && bills.length > 0 ? (
        <Row className="flex-col sm:flex-row sm:items-end" gap="sm">
          <Stack gap="xs" className="min-w-0 flex-1">
            <Text className="text-xs font-medium text-zinc-600">Search</Text>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Invoice no., buyer, GSTIN…"
            />
          </Stack>
          <Stack gap="xs" className="w-full sm:w-40">
            <Text className="text-xs font-medium text-zinc-600">Sort</Text>
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as BillSortKey)}>
              <Option value="updated">Latest updated</Option>
              <Option value="invoice">Invoice no.</Option>
              <Option value="buyer">Buyer name</Option>
            </Select>
          </Stack>
        </Row>
      ) : null}

      {pendingImportFile ? (
        <Banner tone="neutral" role="status">
          <Stack gap="sm">
            <Text className="text-sm">
              Import <strong>{pendingImportFile.name}</strong> — merge keeps existing bills and updates
              matching IDs; replace uses only the backup.
            </Text>
            <Row className="flex-wrap" gap="sm">
              <Button type="button" variant="primary" onClick={() => void runImport(pendingImportFile, "merge")}>
                Merge
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (
                    !confirm(
                      "Replace will remove all saved bills not in this backup. Continue?",
                    )
                  ) {
                    return;
                  }
                  void runImport(pendingImportFile, "replace");
                }}
              >
                Replace all
              </Button>
              <Button type="button" variant="outline" onClick={() => setPendingImportFile(null)}>
                Cancel
              </Button>
            </Row>
          </Stack>
        </Banner>
      ) : null}

      {error ? (
        <Banner tone="error" role="alert">
          {error}
        </Banner>
      ) : null}

      {bills === null ? (
        <Text muted>Loading…</Text>
      ) : bills.length === 0 ? (
        <Text className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-600">
          No bills yet. Download a PDF from the invoice page to save one here.
        </Text>
      ) : filtered.length === 0 ? (
        <Text muted>No bills match your search.</Text>
      ) : (
        <Stack gap="lg">
          {sections.map((sec) => {
            const sectionDomId = `bills-company-${sec.sellerGstin.replace(/[^a-zA-Z0-9]/g, "_")}`;
            return (
              <Section
                key={sec.sellerGstin}
                aria-labelledby={sectionDomId}
                className="rounded-xl border border-zinc-200 bg-zinc-50/40 p-4 shadow-sm"
              >
                <Stack gap="xs" className="mb-3 border-b border-zinc-200 pb-3">
                  <Heading level={2} id={sectionDomId} className="text-base font-semibold text-zinc-900">
                    {sec.heading}
                  </Heading>
                  <Text className="text-xs text-zinc-600">{sec.subtitle}</Text>
                </Stack>
                <Ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
                  {sec.bills.map((b) => (
                    <Li
                      key={b.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Stack gap="xs">
                        <Text className="font-medium text-zinc-900">
                          {b.title || b.invoice.invoiceNumber}
                        </Text>
                        <Text className="text-xs text-zinc-500">
                          Updated {new Date(b.updatedAt).toLocaleString()} · Invoice{" "}
                          {b.invoice.invoiceNumber}
                        </Text>
                      </Stack>
                      <Row className="flex-wrap" gap="sm">
                        <AppLink
                          href={`/bill?billId=${encodeURIComponent(b.id)}`}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50"
                        >
                          Edit
                        </AppLink>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busyId === b.id}
                          onClick={() => void onDuplicate(b)}
                        >
                          Duplicate
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          disabled={busyId === b.id}
                          onClick={() => void onDelete(b.id)}
                        >
                          {busyId === b.id ? "…" : "Delete"}
                        </Button>
                      </Row>
                    </Li>
                  ))}
                </Ul>
              </Section>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
