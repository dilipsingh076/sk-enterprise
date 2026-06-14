import {
  DEFAULT_INVOICE_GST_PERCENT,
  initialTaxFieldsFromSeller,
} from "@/lib/invoice/billTaxDefaults";
import { formatInvoiceDate, normalizeInvoiceDateStorage } from "@/lib/invoice/formatInvoiceDate";
import { coerceIndianGstRate } from "@/lib/invoice/indianGstRates";
import { roundTo2 } from "@/lib/invoice/calculations";
import type { InvoiceFormInput, LineItem } from "@/lib/invoice/schema";
import type { UserProfile } from "@/lib/invoice/userProfile";
import {
  ensureUserProfileDefaults,
  getInvoiceNumberPrefixForCompanyId,
  getSellerForCompanyId,
  resolveActiveCompanyId,
} from "@/lib/profile/profileStorage";

/** Ensures each line has tax fields; line discounts are no longer used in the UI. */
export function normalizeLineItemsLine(
  row: LineItem,
  defaultTaxPercent = DEFAULT_INVOICE_GST_PERCENT,
): LineItem {
  const tax =
    row.taxPercent != null && Number.isFinite(Number(row.taxPercent))
      ? coerceIndianGstRate(row.taxPercent, defaultTaxPercent)
      : coerceIndianGstRate(defaultTaxPercent);
  return {
    ...row,
    quantity: roundTo2(row.quantity),
    rate: roundTo2(row.rate),
    discountKind: "AMOUNT",
    discount: 0,
    taxPercent: tax,
  };
}

type LegacyInvoiceMeta = {
  paymentTerms?: string;
  freightPaymentTerms?: string;
  insuranceTerms?: string;
  machineSerialNo?: string;
};

export function normalizeLoadedInvoiceForm(data: InvoiceFormInput): InvoiceFormInput {
  const gst = Number(data.gstPercent);
  const defaultTax = Number.isFinite(gst) ? gst : DEFAULT_INVOICE_GST_PERCENT;
  const legacy = data as InvoiceFormInput & LegacyInvoiceMeta;
  const {
    paymentTerms: legacyPaymentTerms,
    freightPaymentTerms: _f,
    insuranceTerms: _i,
    machineSerialNo: _m,
    ...rest
  } = legacy;
  void _f;
  void _i;
  void _m;
  return {
    ...rest,
    purchaserName: rest.purchaserName?.trim() || legacyPaymentTerms?.trim() || "",
    extraCharges: rest.extraCharges != null ? roundTo2(rest.extraCharges) : rest.extraCharges,
    billTo: { ...rest.billTo, pincode: rest.billTo.pincode ?? "" },
    shipTo: rest.shipTo ? { ...rest.shipTo, pincode: rest.shipTo.pincode ?? "" } : rest.shipTo,
    lineItems: rest.lineItems.map((row) => normalizeLineItemsLine(row, defaultTax)),
    invoiceDate: normalizeInvoiceDateStorage(rest.invoiceDate),
    purchaseOrderDate: normalizeInvoiceDateStorage(rest.purchaseOrderDate),
  };
}

/** Empty customer — form stays invalid until buyer details are entered. */
export function emptyBillTo(): InvoiceFormInput["billTo"] {
  return {
    name: "",
    address: "",
    gstin: "",
    pan: "",
    stateName: "",
    stateCode: "",
    city: "",
    pincode: "",
    mobile: "",
    kindAttn: "",
  };
}

/** Bill page initial state: company seller + tax from seller; customer & lines empty. */
export function buildBillFormDefaults(
  profile: UserProfile,
  activeCompanyId: string | null | undefined,
): InvoiceFormInput {
  const p = ensureUserProfileDefaults(profile);
  const cid = resolveActiveCompanyId(p, activeCompanyId);
  const seller = getSellerForCompanyId(p, cid);
  const tax = initialTaxFieldsFromSeller(seller);
  const today = formatInvoiceDate(new Date().toISOString().slice(0, 10));
  const prefix = getInvoiceNumberPrefixForCompanyId(p, cid);
  return {
    seller,
    invoiceNumber: prefix,
    invoiceDate: today,
    ...tax,
    eWayBill: "",
    vehicle: "",
    transport: "",
    poNumber: "",
    deliveryNote: "",
    destination: "",
    purchaserName: "",
    purchaseOrderDate: "",
    deliveryTermsLine: "",
    hypothecation: "",
    lrNumberAndDate: "",
    otherMeta: "",
    billTo: emptyBillTo(),
    shipSameAsBill: true,
    shipTo: undefined,
    lineItems: [],
    eInvoice: {
      irn: "",
      ackNumber: "",
      ackDate: "",
      qrImageBase64: "",
    },
  };
}

/** After a successful PDF: keep seller, reset customer & lines; tax from seller again. */
export function formStateForNextBill(
  profile: UserProfile,
  activeCompanyId: string | null | undefined,
): InvoiceFormInput {
  return buildBillFormDefaults(profile, activeCompanyId);
}
