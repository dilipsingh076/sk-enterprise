import type { Party } from "@/lib/invoice/schema";
import type { UserProfile } from "@/lib/invoice/userProfile";

/** Prepend party to `recentBillTo`, dedupe by GSTIN, max 20 (same rules as storage). */
export function mergeRecentBillToUserProfile(profile: UserProfile, party: Party): UserProfile {
  const gst = party.gstin.toUpperCase();
  const list = profile.recentBillTo ?? [];
  const nextList = [party, ...list.filter((x) => x.gstin.toUpperCase() !== gst)].slice(0, 20);
  return { ...profile, recentBillTo: nextList };
}
