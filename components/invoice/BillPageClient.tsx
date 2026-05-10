"use client";

import dynamic from "next/dynamic";

const InvoiceFormHost = dynamic(
  async () => {
    const { InvoiceForm } = await import("@/components/invoice/InvoiceForm");
    function Host({ editBillId }: { editBillId?: string | null }) {
      return <InvoiceForm editBillId={editBillId ?? undefined} />;
    }
    return { default: Host };
  },
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-3xl px-3 py-16 text-center text-sm text-zinc-600 sm:px-4">
        Loading…
      </div>
    ),
  },
);

export function BillPageClient({ editBillId }: { editBillId?: string | null }) {
  return <InvoiceFormHost editBillId={editBillId} />;
}
