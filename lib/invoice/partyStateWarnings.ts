import { stateCodeFromGstin } from "@/lib/invoice/gstin";
import type { Party } from "@/lib/invoice/schema";

/** Non-blocking hints for bill-to / ship-to GST state vs declared state. */
export function partyStateWarning(party: Pick<Party, "gstin" | "stateCode" | "stateName">): string | null {
  const fromGstin = stateCodeFromGstin(party.gstin);
  const code = party.stateCode?.trim();
  if (!fromGstin || !code) return null;
  if (fromGstin !== code) {
    return `GSTIN indicates state code ${fromGstin}, but ${code} is selected.`;
  }
  return null;
}
