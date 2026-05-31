import { syncInvoiceTaxFields } from "@/lib/invoice/billTaxDefaults";
import type { InvoiceFormInput } from "@/lib/invoice/schema";
import type { UserProfile } from "@/lib/invoice/userProfile";
import {
  ensureInvoiceNumberForCompanyId,
  ensureUserProfileDefaults,
  getSellerForCompanyId,
  resolveActiveCompanyId,
} from "@/lib/profile/profileStorage";

/** Apply active company seller + invoice number; tax/PoS come from the bill (seller + bill-to). */
export function applyProfileToInvoice(
  data: InvoiceFormInput,
  profile: UserProfile,
  activeCompanyId: string | null | undefined,
): InvoiceFormInput {
  const profileE = ensureUserProfileDefaults(profile);
  const cid = resolveActiveCompanyId(profileE, activeCompanyId);
  const seller = getSellerForCompanyId(profileE, cid);
  const invoiceNumber = ensureInvoiceNumberForCompanyId(
    data.invoiceNumber ?? "",
    profileE,
    cid,
  );
  return syncInvoiceTaxFields({
    ...data,
    seller,
    invoiceNumber,
  });
}
