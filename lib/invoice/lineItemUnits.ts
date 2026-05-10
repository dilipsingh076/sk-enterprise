/**
 * Invoice line UOM — GST UQC-style codes plus common spellings used on Indian invoices.
 * Values are what we store and print on the PDF.
 */
const UQC_AND_COMMON: readonly { readonly value: string; readonly label: string }[] = [
  { value: "BAG", label: "BAG — Bags" },
  { value: "BAL", label: "BAL — Bale" },
  { value: "BDL", label: "BDL — Bundles" },
  { value: "BKL", label: "BKL — Buckles" },
  { value: "BOU", label: "BOU — Billion of units" },
  { value: "BOX", label: "BOX — Box" },
  { value: "BTL", label: "BTL — Bottles" },
  { value: "BUN", label: "BUN — Bunches" },
  { value: "CAN", label: "CAN — Cans" },
  { value: "CBM", label: "CBM — Cubic metres" },
  { value: "CCM", label: "CCM — Cubic centimetres" },
  { value: "CMS", label: "CMS — Centimetres" },
  { value: "CTN", label: "CTN — Cartons" },
  { value: "DOZ", label: "DOZ — Dozen" },
  { value: "DRM", label: "DRM — Drums" },
  { value: "GGK", label: "GGK — Great gross" },
  { value: "GMS", label: "GMS — Grams" },
  { value: "GRS", label: "GRS — Gross" },
  { value: "GYD", label: "GYD — Gross yards" },
  { value: "KGS", label: "KGS — Kilograms" },
  { value: "KLR", label: "KLR — Kilolitre" },
  { value: "KME", label: "KME — Kilometre" },
  { value: "LTR", label: "LTR — Litres" },
  { value: "MLT", label: "MLT — Millilitre" },
  { value: "MTR", label: "MTR — Metres" },
  { value: "MTT", label: "MTT — Metric ton" },
  { value: "NOS", label: "NOS — Numbers" },
  { value: "PAC", label: "PAC — Packs" },
  { value: "PCS", label: "PCS — Pieces" },
  { value: "PRS", label: "PRS — Pairs" },
  { value: "QTL", label: "QTL — Quintal" },
  { value: "ROL", label: "ROL — Rolls" },
  { value: "SET", label: "SET — Sets" },
  { value: "SQF", label: "SQF — Square feet" },
  { value: "SQM", label: "SQM — Square metres" },
  { value: "SQY", label: "SQY — Square yards" },
  { value: "TBS", label: "TBS — Tablets" },
  { value: "TGM", label: "TGM — Ten gross" },
  { value: "THD", label: "THD — Thousands" },
  { value: "TON", label: "TON — Tonnes" },
  { value: "TUB", label: "TUB — Tubes" },
  { value: "UGI", label: "UGI — US gallons" },
  { value: "UNT", label: "UNT — Units" },
  { value: "YDS", label: "YDS — Yards" },
  { value: "OTH", label: "OTH — Others" },
  { value: "Nos", label: "Nos — Numbers (common)" },
  { value: "Pcs", label: "Pcs — Pieces (common)" },
  { value: "Kg", label: "Kg — Kilograms (common)" },
  { value: "g", label: "g — Grams (common)" },
  { value: "Ltr", label: "Ltr — Litres (common)" },
  { value: "ml", label: "ml — Millilitre (common)" },
  { value: "Mtr", label: "Mtr — Metres (common)" },
  { value: "Sqm", label: "Sqm — Square metres (common)" },
  { value: "Sqft", label: "Sqft — Square feet (common)" },
  { value: "Hr", label: "Hr — Hours (services)" },
  { value: "Day", label: "Day — Days" },
  { value: "Mon", label: "Mon — Months" },
  { value: "Job", label: "Job — Job (services)" },
  { value: "Lot", label: "Lot — Lot" },
  { value: "Svc", label: "Svc — Service" },
];

const KNOWN_VALUES = new Set(UQC_AND_COMMON.map((o) => o.value));

/** Stable order: Nos → NOS, then rest A–Z by label. */
export const LINE_ITEM_UNIT_OPTIONS: { value: string; label: string }[] = (() => {
  const byValue = new Map(UQC_AND_COMMON.map((o) => [o.value, o] as const));
  const nos = byValue.get("Nos");
  const n = byValue.get("NOS");
  const rest = UQC_AND_COMMON.filter((o) => o.value !== "NOS" && o.value !== "Nos").slice();
  rest.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  const head = [nos, n].filter(Boolean) as { value: string; label: string }[];
  return [...head, ...rest];
})();

export function isKnownLineItemUnit(value: string): boolean {
  return KNOWN_VALUES.has(value.trim());
}

/** Options for the unit select; keeps unknown stored values visible so old bills stay editable. */
export function getLineItemUnitOptions(currentUnit: string): { value: string; label: string }[] {
  const cur = currentUnit.trim();
  if (!cur || isKnownLineItemUnit(cur)) {
    return [...LINE_ITEM_UNIT_OPTIONS];
  }
  return [{ value: cur, label: `${cur} (current)` }, ...LINE_ITEM_UNIT_OPTIONS];
}
