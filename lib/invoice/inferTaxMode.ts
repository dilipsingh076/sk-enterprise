import { stateCodeFromGstin } from "@/lib/invoice/gstin";

/** Two-digit GST state code (e.g. 05, 27). */
export function isValidGstStateCode(code: unknown): code is string {
  return normalizeStateCode(code) != null;
}

export type TaxMode = "IGST" | "CGST_SGST";

export type PartyStateSource = {
  stateCode?: string;
  gstin?: string;
};

/** Normalize "5" → "05", reject non-numeric. */
export function normalizeStateCode(code: unknown): string | null {
  if (code == null) return null;
  const t = String(code).trim();
  if (!/^\d{1,2}$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 1 || n > 37) return null;
  return t.padStart(2, "0");
}

/**
 * State for GST supply comparison: GSTIN prefix wins over the state code field
 * (fields are often left at the empty default while GSTIN is correct).
 */
export function resolvePartyStateCode(party: PartyStateSource | undefined): string | null {
  if (!party) return null;
  const fromGstin = stateCodeFromGstin(party.gstin);
  if (fromGstin) return fromGstin;
  return normalizeStateCode(party.stateCode);
}

/**
 * Interstate (different state codes) → IGST on the full GST rate.
 * Same state → CGST + SGST (each half of the GST rate, per Indian GST rules).
 */
export function inferTaxModeFromStateCodes(
  sellerStateCode: string | undefined,
  supplyStateCode: string | undefined,
  fallback: TaxMode = "IGST",
): TaxMode {
  const seller = normalizeStateCode(sellerStateCode);
  const supply = normalizeStateCode(supplyStateCode);
  if (!seller || !supply) {
    return fallback;
  }
  return seller === supply ? "CGST_SGST" : "IGST";
}

export function inferTaxModeForParties(
  seller: PartyStateSource | undefined,
  buyer: PartyStateSource | undefined,
  placeOfSupplyCode: string | undefined,
  fallback: TaxMode = "IGST",
): TaxMode {
  const sGst = seller?.gstin?.trim().toUpperCase() ?? "";
  const bGst = buyer?.gstin?.trim().toUpperCase() ?? "";
  if (sGst.length === 15 && bGst.length === 15 && sGst === bGst) {
    return "CGST_SGST";
  }

  const sellerState = resolvePartyStateCode(seller);
  const buyerState =
    resolvePartyStateCode(buyer) ?? normalizeStateCode(placeOfSupplyCode) ?? undefined;

  return inferTaxModeFromStateCodes(sellerState ?? undefined, buyerState ?? undefined, fallback);
}

/** @deprecated Prefer inferTaxModeForParties with seller/buyer objects. */
export function inferTaxModeForInvoice(
  sellerStateCode: string | undefined,
  billToStateCode: string | undefined,
  placeOfSupplyCode: string | undefined,
  fallback: TaxMode = "IGST",
): TaxMode {
  return inferTaxModeForParties(
    { stateCode: sellerStateCode },
    { stateCode: billToStateCode },
    placeOfSupplyCode,
    fallback,
  );
}
