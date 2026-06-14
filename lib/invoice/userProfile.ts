import { z } from "zod";
import { roundTo2 } from "@/lib/invoice/calculations";
import { hasAtMost2Decimals, TWO_DECIMAL_MESSAGE } from "@/lib/invoice/formatDecimal";
import { partySchema, sellerSchema } from "@/lib/invoice/schema";

export const savedLineItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  hsn: z.string().min(4),
  unit: z.string().min(1),
  rate: z.coerce
    .number()
    .nonnegative()
    .refine(hasAtMost2Decimals, TWO_DECIMAL_MESSAGE)
    .transform(roundTo2),
  taxPercent: z.coerce.number().min(0).max(100).optional(),
});

export type SavedLineItem = z.infer<typeof savedLineItemSchema>;

export const companyPresetSchema = z.object({
  id: z.string().min(1),
  /** Shown in the invoice “Issue as” menu */
  label: z.string().min(1, "Menu name required"),
  /** Short prefix for invoice numbers, e.g. UK, MH → `UK2025-001` */
  invoiceNumberPrefix: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .max(12, "Max 12 characters")
      .regex(/^[A-Za-z0-9]+$/, "Letters and digits only")
      .transform((s) => s.toUpperCase())
      .optional(),
  ),
  seller: sellerSchema,
});

export const userProfileSchema = z
  .object({
    companies: z.array(companyPresetSchema).min(2).max(2),
    /** Which company new invoices start with (can still switch on the invoice page). */
    defaultCompanyId: z.string().min(1),
    /** Recently used bill-to parties (deduped by GSTIN); max 20. */
    recentBillTo: z.array(partySchema).max(20).default([]),
    /** Reusable line templates (description, HSN, unit, rate, GST %). */
    savedLineItems: z.array(savedLineItemSchema).max(40).default([]),
  })
  .refine((d) => d.companies.some((c) => c.id === d.defaultCompanyId), {
    message: "Default company must match one of the two profiles",
    path: ["defaultCompanyId"],
  });

export type CompanyPreset = z.infer<typeof companyPresetSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
