import { computeInvoiceTotals } from "@/lib/invoice/calculations";
import { stateNameFromGstCode } from "@/lib/invoice/indianStates";
import { coerceIndianGstRate } from "@/lib/invoice/indianGstRates";
import type { InvoiceFormInput, Party, Seller } from "@/lib/invoice/schema";
import { stateCodeFromGstin } from "@/lib/invoice/gstin";
import { inferTaxModeForParties, resolvePartyStateCode } from "@/lib/invoice/inferTaxMode";

/** Align bill-to state code & name with GSTIN prefix (overrides stale state name). */
export function billToAlignedWithGstin(billTo: Party): Party {
  const code = stateCodeFromGstin(billTo.gstin);
  if (!code) return billTo;
  const name = stateNameFromGstCode(code);
  return {
    ...billTo,
    stateCode: code,
    stateName: name ?? billTo.stateName,
  };
}

/** Default GST % for new bills when not set on the invoice. */
export const DEFAULT_INVOICE_GST_PERCENT = 18;

/** Starting tax / PoS fields for a new bill (from active company seller only). */
export function initialTaxFieldsFromSeller(seller: Seller): Pick<
  InvoiceFormInput,
  | "placeOfSupplyState"
  | "placeOfSupplyCode"
  | "reverseCharge"
  | "taxMode"
  | "gstPercent"
  | "extraCharges"
  | "extraChargesLabel"
  | "roundOff"
> {
  const code = resolvePartyStateCode(seller) ?? "05";
  const stateName = seller.stateName?.trim() ?? "";
  return {
    placeOfSupplyState: stateName,
    placeOfSupplyCode: code,
    reverseCharge: false,
    taxMode: inferTaxModeForParties(seller, undefined, code, "IGST"),
    gstPercent: DEFAULT_INVOICE_GST_PERCENT,
    extraCharges: 0,
    extraChargesLabel: "Other charges",
    roundOff: 0,
  };
}

/**
 * Place of supply + IGST/CGST from seller & bill-to on the invoice (not profile defaults).
 * Preserves gst % and extra charges; round-off is computed from totals.
 */
export function syncInvoiceTaxFields(data: InvoiceFormInput): InvoiceFormInput {
  const seller = data.seller;
  const billTo = data.billTo;

  const buyerState = resolvePartyStateCode(billTo);
  const sellerState = resolvePartyStateCode(seller);

  let placeOfSupplyCode = data.placeOfSupplyCode?.trim() ?? "";
  let placeOfSupplyState = data.placeOfSupplyState?.trim() ?? "";

  if (buyerState) {
    placeOfSupplyCode = buyerState;
    placeOfSupplyState =
      stateNameFromGstCode(buyerState) ?? billTo.stateName?.trim() ?? placeOfSupplyState;
  } else if (sellerState) {
    placeOfSupplyCode = sellerState;
    placeOfSupplyState =
      stateNameFromGstCode(sellerState) ?? seller.stateName?.trim() ?? placeOfSupplyState;
  }

  const taxMode = inferTaxModeForParties(
    seller,
    billTo,
    placeOfSupplyCode || undefined,
    data.taxMode ?? "IGST",
  );

  return {
    ...data,
    placeOfSupplyState,
    placeOfSupplyCode,
    taxMode,
    gstPercent: coerceIndianGstRate(
      data.gstPercent != null && Number.isFinite(Number(data.gstPercent))
        ? data.gstPercent
        : DEFAULT_INVOICE_GST_PERCENT,
    ),
    reverseCharge: data.reverseCharge ?? false,
    extraCharges: data.extraCharges ?? 0,
    extraChargesLabel: data.extraChargesLabel ?? "Other charges",
    roundOff: 0,
  };
}

function computedRoundOff(data: InvoiceFormInput): number {
  if (!data.lineItems?.length) return 0;
  return computeInvoiceTotals(
    data.lineItems,
    data.taxMode ?? "IGST",
    Number(data.gstPercent) || 0,
    data.extraCharges ?? 0,
  ).roundOff;
}

/** Purchaser on PDF header; falls back to bill-to name when empty. */
export function resolvePurchaserName(data: InvoiceFormInput): string {
  const explicit = data.purchaserName?.trim();
  if (explicit) return explicit;
  return data.billTo.name?.trim() ?? "";
}

/** Final invoice payload: align bill-to with GSTIN, then derive PoS and tax mode. */
export function prepareInvoicePayload(data: InvoiceFormInput): InvoiceFormInput {
  const billTo = billToAlignedWithGstin(data.billTo);
  const purchaserName = resolvePurchaserName({ ...data, billTo });
  const synced = syncInvoiceTaxFields({
    ...data,
    billTo,
    purchaserName,
  });
  return { ...synced, roundOff: computedRoundOff(synced) };
}
