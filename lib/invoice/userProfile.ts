import { z } from "zod";
import { sellerSchema } from "@/lib/invoice/schema";

export const invoiceTaxDefaultsSchema = z.object({
  placeOfSupplyState: z.string().min(1, "Required"),
  placeOfSupplyCode: z
    .string()
    .length(2, "State code must be 2 digits")
    .regex(/^[0-9]{2}$/),
  reverseCharge: z.boolean(),
  taxMode: z.enum(["IGST", "CGST_SGST"]),
  gstPercent: z.coerce.number().min(0).max(100),
  extraCharges: z.coerce.number().nonnegative().optional(),
  extraChargesLabel: z.string().optional(),
  roundOff: z.coerce.number().optional(),
});

export const companyPresetSchema = z.object({
  id: z.string().min(1),
  /** Shown in the invoice “Issue as” menu */
  label: z.string().min(1, "Menu name required"),
  seller: sellerSchema,
});

export const userProfileSchema = z
  .object({
    companies: z.array(companyPresetSchema).min(2).max(2),
    /** Which company new invoices start with (can still switch on the invoice page). */
    defaultCompanyId: z.string().min(1),
    invoiceTaxDefaults: invoiceTaxDefaultsSchema,
  })
  .refine((d) => d.companies.some((c) => c.id === d.defaultCompanyId), {
    message: "Default company must match one of the two profiles",
    path: ["defaultCompanyId"],
  });

export type CompanyPreset = z.infer<typeof companyPresetSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type InvoiceTaxDefaults = z.infer<typeof invoiceTaxDefaultsSchema>;
