import { BillPageClient } from "@/components/invoice/BillPageClient";
import { Box } from "@/components/ui";

export default async function BillPage({
  searchParams,
}: {
  searchParams: Promise<{ billId?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Box className="mx-auto w-full px-3 py-6 sm:px-4 sm:py-8">
      <BillPageClient editBillId={sp.billId ?? null} />
    </Box>
  );
}
