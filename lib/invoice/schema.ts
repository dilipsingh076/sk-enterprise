import { z } from "zod";

/** 15-char GSTIN; permissive for testing */
const gstinRegex = /^[0-9]{2}[A-Z0-9]{13}$/i;

export const partySchema = z.object({
  name: z
    .string()
    .min(1, "Required")
    .refine((s) => s.trim().length > 0, "Required"),
  address: z
    .string()
    .min(1, "Required")
    .refine((s) => s.trim().length > 0, "Required"),
  pan: z.string().max(10).optional(),
  gstin: z
    .string()
    .length(15, "GSTIN must be 15 characters")
    .regex(gstinRegex, "Invalid GSTIN format"),
  stateName: z.string().min(1, "Required"),
  stateCode: z
    .string()
    .length(2, "State code must be 2 digits")
    .regex(/^[0-9]{2}$/),
  mobile: z.string().optional(),
  kindAttn: z.string().optional(),
});

export const sellerSchema = partySchema.extend({
  phone: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  bankName: z.string().min(1, "Required"),
  accountNo: z.string().min(1, "Required"),
  ifsc: z.string().min(11, "IFSC too short").max(11, "IFSC must be 11 chars"),
  branch: z.string().optional(),
  jurisdiction: z.string().optional(),
  declaration: z.string().optional(),
  certificationLine: z.string().optional(),
  /** Corporate invoice footer (e.g. Putzmeister-style) */
  cin: z.string().optional(),
  tan: z.string().optional(),
  regdOffice: z.string().optional(),
  branchOfficeDetails: z.string().optional(),
  certificationsLine: z.string().optional(),
  /** One line under the company name on the PDF (e.g. sector / scope) */
  pdfHeaderDescription: z.string().optional(),
  /** Numbered terms block shown above signatory */
  termsAndConditions: z.string().optional(),
});

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  hsn: z.string().min(1, "HSN/SAC required"),
  quantity: z.coerce.number().positive("Qty must be > 0"),
  unit: z.string().min(1, "Unit required"),
  rate: z.coerce.number().nonnegative("Rate must be ≥ 0"),
  discount: z.coerce.number().nonnegative().optional(),
});

export const eInvoiceFormSchema = z.object({
  irn: z.string().optional(),
  ackNumber: z.string().optional(),
  ackDate: z.string().optional(),
  qrImageBase64: z.string().optional(),
});

export const invoiceSchema = z
  .object({
    seller: sellerSchema,
    invoiceNumber: z.string().min(1, "Invoice no. required"),
    invoiceDate: z.string().min(1, "Date required"),
    placeOfSupplyState: z.string().min(1, "Required"),
    placeOfSupplyCode: z
      .string()
      .length(2)
      .regex(/^[0-9]{2}$/),
    reverseCharge: z.boolean(),
    eWayBill: z.string().optional(),
    vehicle: z.string().optional(),
    transport: z.string().optional(),
    poNumber: z.string().optional(),
    deliveryNote: z.string().optional(),
    destination: z.string().optional(),
    paymentTerms: z.string().optional(),
    freightPaymentTerms: z.string().optional(),
    purchaseOrderDate: z.string().optional(),
    machineSerialNo: z.string().optional(),
    insuranceTerms: z.string().optional(),
    deliveryTermsLine: z.string().optional(),
    hypothecation: z.string().optional(),
    lrNumberAndDate: z.string().optional(),
    otherMeta: z.string().optional(),
    billTo: partySchema,
    shipSameAsBill: z.boolean(),
    shipTo: partySchema.optional(),
    lineItems: z.array(lineItemSchema).min(1, "Add at least one line"),
    taxMode: z.enum(["IGST", "CGST_SGST"]),
    gstPercent: z.coerce.number().min(0).max(100),
    extraCharges: z.coerce.number().nonnegative().optional(),
    extraChargesLabel: z.string().optional(),
    roundOff: z.coerce.number().optional(),
    eInvoice: eInvoiceFormSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.shipSameAsBill) {
      const parsed = partySchema.safeParse(data.shipTo);
      if (!parsed.success) {
        ctx.addIssue({
          code: "custom",
          message: "Ship-to details required when not same as bill-to",
          path: ["shipTo"],
        });
      }
    }
  });

export type Party = z.infer<typeof partySchema>;
export type Seller = z.infer<typeof sellerSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type InvoiceFormInput = z.infer<typeof invoiceSchema>;

/** Validated invoice with resolved ship-to for PDF/API */
export type Invoice = Omit<InvoiceFormInput, "shipTo"> & {
  shipToResolved: Party;
};

export function resolveInvoice(data: InvoiceFormInput): Invoice {
  const shipToResolved = data.shipSameAsBill
    ? data.billTo
    : (data.shipTo as Party);
  const { shipTo: _omit, ...rest } = data;
  return { ...rest, shipToResolved };
}
