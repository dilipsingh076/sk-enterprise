import { BillsListClient } from "@/components/bills/BillsListClient";
import { Box } from "@/components/ui";

export default function BillsPage() {
  return (
    <Box className="mx-auto w-full px-3 py-6 sm:px-4 sm:py-8">
      <BillsListClient />
    </Box>
  );
}
