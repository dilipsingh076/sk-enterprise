"use client";

import dynamic from "next/dynamic";
import { Box, Text } from "@/components/ui";

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
      <Box className="mx-auto w-full px-3 py-16 text-center sm:px-4">
        <Text className="text-sm text-zinc-600">Loading…</Text>
      </Box>
    ),
  },
);

export function BillPageClient({ editBillId }: { editBillId?: string | null }) {
  return <InvoiceFormHost editBillId={editBillId} />;
}
