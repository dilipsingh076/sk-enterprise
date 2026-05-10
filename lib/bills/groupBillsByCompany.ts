import type { UserProfile } from "@/lib/invoice/userProfile";
import { ensureUserProfileDefaults } from "@/lib/profile/profileStorage";
import type { BillRecord } from "@/lib/storage/serverJsonStore";

export type BillsCompanySection = {
  sellerGstin: string;
  heading: string;
  subtitle: string;
  bills: BillRecord[];
};

/** Group saved bills by issuing seller (GSTIN), with a heading from Profile when possible. */
export function groupBillsByCompany(
  bills: BillRecord[],
  profile: UserProfile | null,
): BillsCompanySection[] {
  const byGst = new Map<string, BillRecord[]>();
  for (const b of bills) {
    const g = b.invoice.seller.gstin.trim().toUpperCase() || "—";
    if (!byGst.has(g)) byGst.set(g, []);
    byGst.get(g)!.push(b);
  }

  const p = profile ? ensureUserProfileDefaults(profile) : null;

  const sections: BillsCompanySection[] = [...byGst.entries()].map(([gstin, list]) => {
    const sorted = [...list].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const first = sorted[0]!;
    const company = p?.companies.find((c) => c.seller.gstin.trim().toUpperCase() === gstin);
    const heading =
      company?.label?.trim() || first.invoice.seller.name?.trim() || `GSTIN ${gstin}`;
    const n = sorted.length;
    const subtitle = `${gstin} · ${n} saved bill${n === 1 ? "" : "s"}`;
    return { sellerGstin: gstin, heading, subtitle, bills: sorted };
  });

  sections.sort((a, b) => a.heading.localeCompare(b.heading, undefined, { sensitivity: "base" }));
  return sections;
}
