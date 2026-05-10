import type { InvoiceFormInput } from "@/lib/invoice/schema";
import type { UserProfile } from "@/lib/invoice/userProfile";
import {
  ensureInvoiceNumberForCompanyId,
  ensureUserProfileDefaults,
  getSellerAlignedTaxDefaults,
  getSellerForCompanyId,
  resolveActiveCompanyId,
} from "@/lib/profile/profileStorage";

function billToHasMeaningfulState(billTo: InvoiceFormInput["billTo"]): boolean {
  const n = billTo.name?.trim().length ?? 0;
  const a = billTo.address?.trim().length ?? 0;
  return n > 0 && a > 0 && /^[0-9]{2}$/.test(billTo.stateCode?.trim() ?? "");
}

/** When buyer + seller state codes are known, pick IGST vs CGST/SGST from interstate rule. */
function inferTaxMode(
  data: InvoiceFormInput,
  profile: UserProfile,
  sellerStateCode: string | undefined,
): InvoiceFormInput["taxMode"] {
  const profileFallback = profile.invoiceTaxDefaults.taxMode;
  if (!billToHasMeaningfulState(data.billTo)) {
    return data.taxMode ?? profileFallback;
  }
  const sc = sellerStateCode?.trim();
  const bc = data.billTo.stateCode?.trim();
  if (!/^[0-9]{2}$/.test(sc ?? "")) {
    return data.taxMode ?? profileFallback;
  }
  return bc === sc ? "CGST_SGST" : "IGST";
}

/** Apply seller + tax defaults for the active company (PoS follows seller state; tax mode follows buyer vs seller when known). */
export function applyProfileToInvoice(
  data: InvoiceFormInput,
  profile: UserProfile,
  activeCompanyId: string | null | undefined,
): InvoiceFormInput {
  const profileE = ensureUserProfileDefaults(profile);
  const cid = resolveActiveCompanyId(profileE, activeCompanyId);
  const seller = getSellerForCompanyId(profileE, cid);
  const t = getSellerAlignedTaxDefaults(profileE, cid);
  const taxMode = inferTaxMode(data, profileE, seller.stateCode);
  const invoiceNumber = ensureInvoiceNumberForCompanyId(
    data.invoiceNumber ?? "",
    profileE,
    cid,
  );
  return {
    ...data,
    seller,
    invoiceNumber,
    placeOfSupplyState: t.placeOfSupplyState,
    placeOfSupplyCode: t.placeOfSupplyCode,
    reverseCharge: t.reverseCharge,
    taxMode,
    gstPercent: t.gstPercent,
    extraCharges: t.extraCharges ?? 0,
    extraChargesLabel: t.extraChargesLabel ?? "Other charges",
    roundOff: t.roundOff ?? 0,
  };
}
