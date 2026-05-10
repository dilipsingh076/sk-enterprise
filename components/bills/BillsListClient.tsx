"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { groupBillsByCompany } from "@/lib/bills/groupBillsByCompany";
import type { UserProfile } from "@/lib/invoice/userProfile";
import type { BillRecord } from "@/lib/storage/serverJsonStore";
import { deleteBill, fetchBills, fetchProfileBundle } from "@/lib/storage/storageApi";
import {
  AppLink,
  Banner,
  Button,
  Code,
  Heading,
  Li,
  Row,
  Section,
  Stack,
  Text,
  Ul,
} from "@/components/ui";

export function BillsListClient() {
  const [bills, setBills] = useState<BillRecord[] | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const sections = useMemo(
    () => (bills === null ? [] : groupBillsByCompany(bills, profile)),
    [bills, profile],
  );

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
            Bills are stored together in{" "}
            <Code className="rounded bg-zinc-200 px-1 py-0.5 text-[11px]">data/bills.json</Code> (local) or
            Vercel Blob in production. Below they are grouped by the company (seller) that issued each bill.
            The same invoice number cannot be saved twice for the same company.
          </Text>
        </Stack>
        <Row gap="sm">
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
                <Heading
                  level={2}
                  id={sectionDomId}
                  className="text-base font-semibold text-zinc-900"
                >
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
                      <Text className="font-medium text-zinc-900">{b.title || b.invoice.invoiceNumber}</Text>
                      <Text className="text-xs text-zinc-500">
                        Updated {new Date(b.updatedAt).toLocaleString()} · Invoice {b.invoice.invoiceNumber}
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
