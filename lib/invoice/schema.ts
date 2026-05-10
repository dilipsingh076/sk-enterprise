import { z } from "zod";

/** 15-char GSTIN (standard India format) */
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function trimStr(s: string) {
  return s.trim();
}

export const partySchema = z.object({
  name: z
    .string()
    .min(1, "Required")
    .transform(trimStr)
    .refine((s) => s.length > 0, "Required"),
  address: z
    .string()
    .min(1, "Required")
    .transform(trimStr)
    .refine((s) => s.length > 0, "Required"),
  pan: z
    .string()
    .optional()
    .transform((s) => {
      if (s == null) return undefined;
      const t = s.trim();
      if (t === "") return undefined;
      return t.toUpperCase();
    })
    .refine((s) => s === undefined || (s.length === 10 && panRegex.test(s)), {
      message: "Invalid PAN (e.g. ABCDE1234F)",
    }),
  gstin: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .pipe(
      z
        .string()
        .length(15, "GSTIN must be 15 characters")
        .regex(gstinRegex, "Invalid GSTIN format"),
    ),
  stateName: z
    .string()
    .min(1, "Required")
    .transform(trimStr)
    .refine((s) => s.length > 0, "Required"),
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
  ifsc: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .pipe(
      z
        .string()
        .length(11, "IFSC must be 11 characters")
        .regex(ifscRegex, "Invalid IFSC (e.g. HDFC0001234)"),
    ),
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

export const lineItemDiscountKindSchema = z.enum(["AMOUNT", "PERCENT"]);

const lineItemBaseSchema = z.object({
  description: z
    .string()
    .min(1, "Description required")
    .transform(trimStr)
    .refine((s) => s.length > 0, "Description required"),
  hsn: z
    .string()
    .transform(trimStr)
    .pipe(
      z
        .string()
        .min(1, "HSN/SAC required")
        .max(12, "HSN/SAC too long")
        .regex(/^\d{4,12}$/, "HSN/SAC must be 4–12 digits"),
    ),
  quantity: z.coerce.number().positive("Qty must be > 0"),
  unit: z
    .string()
    .min(1, "Unit required")
    .transform(trimStr)
    .refine((s) => s.length > 0, "Unit required"),
  rate: z.coerce.number().nonnegative("Rate must be ≥ 0"),
  discountKind: lineItemDiscountKindSchema.default("AMOUNT"),
  discount: z.coerce.number().nonnegative("Discount must be ≥ 0").default(0),
});

export const lineItemSchema = lineItemBaseSchema.superRefine((line, ctx) => {
  const gross = Math.round(line.quantity * line.rate * 100) / 100;
  const d = line.discount ?? 0;
  if (line.discountKind === "PERCENT") {
    if (d > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Discount % cannot exceed 100",
        path: ["discount"],
      });
    }
  } else if (d > gross + 0.005) {
    ctx.addIssue({
      code: "custom",
      message: "Discount cannot exceed qty × rate",
      path: ["discount"],
    });
  }
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
    invoiceNumber: z
      .string()
      .min(1, "Invoice no. required")
      .transform(trimStr)
      .refine((s) => s.length > 0, "Invoice no. required"),
    invoiceDate: z
      .string()
      .min(1, "Date required")
      .transform(trimStr)
      .refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s), "Use YYYY-MM-DD")
      .refine((s) => {
        const [y, m, d] = s.split("-").map(Number);
        if (!y || !m || !d) return false;
        const dt = new Date(y, m - 1, d);
        return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
      }, "Invalid calendar date"),
    placeOfSupplyState: z
      .string()
      .min(1, "Required")
      .transform(trimStr)
      .refine((s) => s.length > 0, "Required"),
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
  const { shipTo: shipToOmitted, ...rest } = data;
  void shipToOmitted;
  return { ...rest, shipToResolved };
}
