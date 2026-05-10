import type { InvoiceFormInput, LineItem } from "@/lib/invoice/schema";
import type { UserProfile } from "@/lib/invoice/userProfile";
import {
  ensureUserProfileDefaults,
  getInvoiceNumberPrefixForCompanyId,
  getSellerAlignedTaxDefaults,
  getSellerForCompanyId,
  resolveActiveCompanyId,
} from "@/lib/profile/profileStorage";

/** Ensures each line has discount fields (older saved drafts omit them). */
export function normalizeLineItemsLine(row: LineItem): LineItem {
  return {
    ...row,
    discountKind: row.discountKind === "PERCENT" ? "PERCENT" : "AMOUNT",
    discount: row.discount ?? 0,
  };
}

export function normalizeLoadedInvoiceForm(data: InvoiceFormInput): InvoiceFormInput {
  return {
    ...data,
    lineItems: data.lineItems.map(normalizeLineItemsLine),
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
    stateCode: "01",
    mobile: "",
    kindAttn: "",
  };
}

/** Bill page initial state: profile seller + tax defaults, empty customer & lines. */
export function buildBillFormDefaults(
  profile: UserProfile,
  activeCompanyId: string | null | undefined,
): InvoiceFormInput {
  const p = ensureUserProfileDefaults(profile);
  const cid = resolveActiveCompanyId(p, activeCompanyId);
  const t = getSellerAlignedTaxDefaults(p, cid);
  const today = new Date().toISOString().slice(0, 10);
  const prefix = getInvoiceNumberPrefixForCompanyId(p, cid);
  return {
    seller: getSellerForCompanyId(p, cid),
    invoiceNumber: `${prefix}-`,
    invoiceDate: today,
    placeOfSupplyState: t.placeOfSupplyState,
    placeOfSupplyCode: t.placeOfSupplyCode,
    reverseCharge: t.reverseCharge,
    eWayBill: "",
    vehicle: "",
    transport: "",
    poNumber: "",
    deliveryNote: "",
    destination: "",
    paymentTerms: "",
    freightPaymentTerms: "",
    purchaseOrderDate: "",
    machineSerialNo: "",
    insuranceTerms: "",
    deliveryTermsLine: "",
    hypothecation: "",
    lrNumberAndDate: "",
    otherMeta: "",
    billTo: emptyBillTo(),
    shipSameAsBill: true,
    shipTo: undefined,
    lineItems: [],
    taxMode: t.taxMode,
    gstPercent: t.gstPercent,
    extraCharges: t.extraCharges ?? 0,
    extraChargesLabel: t.extraChargesLabel ?? "Other charges",
    roundOff: t.roundOff ?? 0,
    eInvoice: {
      irn: "",
      ackNumber: "",
      ackDate: "",
      qrImageBase64: "",
    },
  };
}

/**
 * After a successful PDF: keep profile-backed seller & tax defaults, clear this bill only.
 */
export function formStateForNextBill(
  profile: UserProfile,
  activeCompanyId: string | null | undefined,
): InvoiceFormInput {
  const p = ensureUserProfileDefaults(profile);
  const cid = resolveActiveCompanyId(p, activeCompanyId);
  const t = getSellerAlignedTaxDefaults(p, cid);
  const today = new Date().toISOString().slice(0, 10);
  const prefix = getInvoiceNumberPrefixForCompanyId(p, cid);
  return {
    seller: getSellerForCompanyId(p, cid),
    invoiceNumber: `${prefix}-`,
    invoiceDate: today,
    placeOfSupplyState: t.placeOfSupplyState,
    placeOfSupplyCode: t.placeOfSupplyCode,
    reverseCharge: t.reverseCharge,
    eWayBill: "",
    vehicle: "",
    transport: "",
    poNumber: "",
    deliveryNote: "",
    destination: "",
    paymentTerms: "",
    freightPaymentTerms: "",
    purchaseOrderDate: "",
    machineSerialNo: "",
    insuranceTerms: "",
    deliveryTermsLine: "",
    hypothecation: "",
    lrNumberAndDate: "",
    otherMeta: "",
    billTo: emptyBillTo(),
    shipSameAsBill: true,
    shipTo: undefined,
    lineItems: [],
    taxMode: t.taxMode,
    gstPercent: t.gstPercent,
    extraCharges: t.extraCharges ?? 0,
    extraChargesLabel: t.extraChargesLabel ?? "Other charges",
    roundOff: t.roundOff ?? 0,
    eInvoice: {
      irn: "",
      ackNumber: "",
      ackDate: "",
      qrImageBase64: "",
    },
  };
}
