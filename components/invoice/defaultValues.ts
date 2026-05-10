import type { InvoiceFormInput } from "@/lib/invoice/schema";
import type { UserProfile } from "@/lib/invoice/userProfile";
import {
  getSellerAlignedTaxDefaults,
  getSellerForCompanyId,
  resolveActiveCompanyId,
} from "@/lib/profile/profileStorage";

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
  const cid = resolveActiveCompanyId(profile, activeCompanyId);
  const t = getSellerAlignedTaxDefaults(profile, cid);
  const today = new Date().toISOString().slice(0, 10);
  return {
    seller: getSellerForCompanyId(profile, cid),
    invoiceNumber: "",
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
  const cid = resolveActiveCompanyId(profile, activeCompanyId);
  const t = getSellerAlignedTaxDefaults(profile, cid);
  const today = new Date().toISOString().slice(0, 10);
  return {
    seller: getSellerForCompanyId(profile, cid),
    invoiceNumber: "",
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
