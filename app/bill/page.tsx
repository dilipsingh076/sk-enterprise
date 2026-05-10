import { BillPageClient } from "@/components/invoice/BillPageClient";

export default async function BillPage({
  searchParams,
}: {
  searchParams: Promise<{ billId?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="min-h-screen bg-zinc-50 py-6 px-3 sm:py-8 sm:px-4">
      <BillPageClient editBillId={sp.billId ?? null} />
    </div>
  );
}
