import { z } from "zod";
import { invoiceSchema } from "@/lib/invoice/schema";

export const billRecordSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  title: z.string().optional(),
  invoice: invoiceSchema,
});

export type BillRecord = z.infer<typeof billRecordSchema>;

export const billsFileSchema = z.object({
  version: z.literal(1),
  bills: z.array(billRecordSchema),
});

export type BillsFile = z.infer<typeof billsFileSchema>;
