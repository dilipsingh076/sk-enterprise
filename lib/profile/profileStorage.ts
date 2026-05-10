import { z } from "zod";
import {
  companyPresetSchema,
  invoiceTaxDefaultsSchema,
  userProfileSchema,
  type CompanyPreset,
  type InvoiceTaxDefaults,
  type UserProfile,
} from "@/lib/invoice/userProfile";
import { sellerSchema, type Seller } from "@/lib/invoice/schema";

/** Legacy shape before two-company profiles */
const legacyProfileSchema = z.object({
  seller: sellerSchema,
  invoiceTaxDefaults: invoiceTaxDefaultsSchema,
});

const SK_SELLER: Seller = {
  name: "SK Enterprises(UK)",
  address:
    "B2, Sahastradhara Road, IT Park Dehradun, Dehradun,\nUttarakhand, 248013",
  gstin: "05ACSPC4640C1ZZ",
  stateName: "Uttarakhand",
  stateCode: "05",
  pan: "ACSPC4640C",
  mobile: "+91-9758428149",
  phone: "+91-9758428149",
  email: "billing@skenterprises.in",
  bankName: "HDFC Bank",
  accountNo: "50100234567890",
  ifsc: "HDFC0001234",
  branch: "Dehradun",
  jurisdiction: "Subject to Dehradun jurisdiction",
  declaration:
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
  certificationLine: "",
  cin: "",
  tan: "",
  regdOffice:
    "B2, Sahastradhara Road, IT Park Dehradun, Dehradun, Uttarakhand – 248013",
  branchOfficeDetails: "",
  certificationsLine: "An ISO 9001, ISO 14001 and ISO 45001 Certified Company",
  pdfHeaderDescription: "Engineering, Infrastructure & Construction Works",
  termsAndConditions: "",
  kindAttn: "",
};

const SECOND_SELLER: Seller = {
  name: "PUTZMEISTER INDIA PRIVATE LIMITED",
  address:
    "Registered / corporate office — edit this address in Profile\n(Maharashtra)",
  gstin: "30AABCP1503H1Z7",
  stateName: "Maharashtra",
  stateCode: "27",
  pan: "",
  mobile: "",
  phone: "+91-22-00000000",
  email: "accounts@putzmeister-india.example.com",
  bankName: "HDFC Bank",
  accountNo: "50100000000000",
  ifsc: "HDFC0000000",
  branch: "Mumbai",
  jurisdiction: "Subject to Mumbai jurisdiction",
  declaration:
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
  certificationLine: "",
  cin: "",
  tan: "",
  regdOffice: "Registered office — edit in Profile, Maharashtra",
  branchOfficeDetails: "",
  certificationsLine: "An ISO 9001 Certified Company",
  termsAndConditions: "",
  kindAttn: "",
};

const DEFAULT_COMPANIES: [CompanyPreset, CompanyPreset] = [
  {
    id: "company-utk",
    label: "SK Enterprises(UK)",
    invoiceNumberPrefix: "UK",
    seller: SK_SELLER,
  },
  {
    id: "company-mh",
    label: "PUTZMEISTER INDIA PRIVATE LIMITED",
    invoiceNumberPrefix: "MH",
    seller: SECOND_SELLER,
  },
];

/**
 * Default profile (starter & “Restore starter profile” in UI).
 */
export const DEFAULT_USER_PROFILE: UserProfile = {
  companies: DEFAULT_COMPANIES,
  defaultCompanyId: "company-utk",
  recentBillTo: [],
  invoiceTaxDefaults: {
    placeOfSupplyState: "Uttarakhand",
    placeOfSupplyCode: "05",
    reverseCharge: false,
    taxMode: "IGST",
    gstPercent: 18,
    extraCharges: 0,
    extraChargesLabel: "Other charges",
    roundOff: 0,
  },
};

function migrateLegacyProfile(raw: unknown): UserProfile | null {
  const leg = legacyProfileSchema.safeParse(raw);
  if (!leg.success) return null;
  const label = leg.data.seller.name.trim().slice(0, 60) || "Company 1";
  return {
    companies: [
      {
        id: "company-utk",
        label,
        invoiceNumberPrefix: "UK",
        seller: leg.data.seller,
      },
      {
        id: "company-mh",
        label: DEFAULT_COMPANIES[1].label,
        invoiceNumberPrefix: "MH",
        seller: DEFAULT_COMPANIES[1].seller,
      },
    ],
    defaultCompanyId: "company-utk",
    recentBillTo: [],
    invoiceTaxDefaults: leg.data.invoiceTaxDefaults,
  };
}

function tryCoerceSingleCompanyArray(raw: unknown): UserProfile | null {
  const row = z
    .object({
      companies: z.array(companyPresetSchema).min(1).max(1),
      defaultCompanyId: z.string(),
      invoiceTaxDefaults: invoiceTaxDefaultsSchema,
    })
    .safeParse(raw);
  if (!row.success) return null;
  const only = row.data.companies[0];
  return {
    companies: [only, DEFAULT_COMPANIES[1]],
    defaultCompanyId: row.data.defaultCompanyId || only.id,
    recentBillTo: [],
    invoiceTaxDefaults: row.data.invoiceTaxDefaults,
  };
}

function inferInvoicePrefix(company: { id: string; label: string }): string {
  if (company.id === "company-utk") return "UK";
  if (company.id === "company-mh") return "MH";
  const paren = company.label.match(/\(([A-Za-z0-9]{2,6})\)\s*$/);
  if (paren?.[1]) return paren[1].toUpperCase();
  const slug = company.id.replace(/^company-/, "").toUpperCase();
  return slug.slice(0, 6) || "INV";
}

/** Normalized prefix for invoice numbers (uppercase). */
export function getInvoiceNumberPrefix(company: CompanyPreset): string {
  const raw = company.invoiceNumberPrefix?.trim();
  if (raw) return raw.toUpperCase();
  return inferInvoicePrefix(company);
}

export function getInvoiceNumberPrefixForCompanyId(profile: UserProfile, companyId: string): string {
  const hit = profile.companies.find((c) => c.id === companyId);
  return hit ? getInvoiceNumberPrefix(hit) : "INV";
}

/** Fill `recentBillTo`, `invoiceNumberPrefix`, and other defaults for older stored JSON. */
export function ensureUserProfileDefaults(profile: UserProfile): UserProfile {
  return {
    ...profile,
    recentBillTo: profile.recentBillTo ?? [],
    companies: profile.companies.map((c) => ({
      ...c,
      invoiceNumberPrefix: getInvoiceNumberPrefix(c),
    })) as UserProfile["companies"],
  };
}

/** Normalize raw JSON from disk (any legacy shape) into `UserProfile`. */
export function normalizeStoredUserProfile(raw: unknown): UserProfile {
  let base: UserProfile;
  const v2 = userProfileSchema.safeParse(raw);
  if (v2.success) base = v2.data;
  else {
    const coerced = tryCoerceSingleCompanyArray(raw);
    if (coerced) base = coerced;
    else {
      const migrated = migrateLegacyProfile(raw);
      base = migrated ?? DEFAULT_USER_PROFILE;
    }
  }
  return ensureUserProfileDefaults(base);
}

export function getSellerForCompanyId(profile: UserProfile, companyId: string): Seller {
  const hit = profile.companies.find((c) => c.id === companyId);
  return hit?.seller ?? profile.companies[0].seller;
}

/**
 * Profile “Default tax” values with place of supply aligned to the selected company’s
 * seller state (so switching issuer updates PoS with company details).
 */
export function getSellerAlignedTaxDefaults(
  profile: UserProfile,
  companyId: string,
): InvoiceTaxDefaults {
  const base = profile.invoiceTaxDefaults;
  const seller = getSellerForCompanyId(profile, companyId);
  const sn = seller.stateName?.trim();
  const sc = seller.stateCode?.trim();
  return {
    ...base,
    placeOfSupplyState: sn && sn.length > 0 ? sn : base.placeOfSupplyState,
    placeOfSupplyCode: sc && /^[0-9]{2}$/.test(sc) ? sc : base.placeOfSupplyCode,
  };
}

export function resolveActiveCompanyId(
  profile: UserProfile,
  activeFromBundle?: string | null,
): string {
  if (activeFromBundle && profile.companies.some((c) => c.id === activeFromBundle)) {
    return activeFromBundle;
  }
  return profile.defaultCompanyId;
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Forces the invoice number to use the selected company’s prefix (Profile → invoice prefix).
 * Strips any known company prefix from the value, then prepends the correct one so bare
 * suffixes like `2025-001` become `UK-2025-001` when that company is active.
 */
export function ensureInvoiceNumberForCompanyId(
  invoiceNumber: string,
  profile: UserProfile,
  companyId: string,
): string {
  const p = ensureUserProfileDefaults(profile);
  const prefix = getInvoiceNumberPrefixForCompanyId(p, companyId);
  let cur = invoiceNumber.trim();
  if (!cur) return `${prefix}-`;

  if (new RegExp(`^${escapeReg(prefix)}-`, "i").test(cur)) {
    return cur.replace(new RegExp(`^${escapeReg(prefix)}-`, "i"), `${prefix}-`);
  }

  for (const c of p.companies) {
    const pref = getInvoiceNumberPrefix(c);
    if (new RegExp(`^${escapeReg(pref)}-`, "i").test(cur)) {
      cur = cur.replace(new RegExp(`^${escapeReg(pref)}-`, "i"), "");
      break;
    }
  }
  cur = cur.replace(/^-+/, "");
  return `${prefix}-${cur}`;
}

/**
 * Splits the stored invoice number into the **active** company’s prefix (for read-only UI)
 * and the editable suffix. If the stored value used another company’s prefix, that segment
 * is stripped so the suffix still makes sense after switching issuer.
 */
export function splitInvoiceNumberTail(
  full: string,
  profile: UserProfile,
  companyId: string,
): { prefix: string; suffix: string } {
  const p = ensureUserProfileDefaults(profile);
  const activePrefix = getInvoiceNumberPrefixForCompanyId(p, companyId);
  let rest = full.trim();

  if (new RegExp(`^${escapeReg(activePrefix)}-`, "i").test(rest)) {
    rest = rest.replace(new RegExp(`^${escapeReg(activePrefix)}-`, "i"), "");
  } else {
    for (const c of p.companies) {
      const pref = getInvoiceNumberPrefix(c);
      if (new RegExp(`^${escapeReg(pref)}-`, "i").test(rest)) {
        rest = rest.replace(new RegExp(`^${escapeReg(pref)}-`, "i"), "");
        break;
      }
    }
  }
  rest = rest.replace(/^-+/, "");
  return { prefix: activePrefix, suffix: rest };
}

/** Inverse of {@link splitInvoiceNumberTail} for the suffix field only. */
export function joinInvoiceNumberTail(prefix: string, suffix: string): string {
  const s = suffix.trim();
  return `${prefix}-${s}`;
}

/**
 * When switching issuer, re-apply the new company’s prefix (same rules as
 * {@link ensureInvoiceNumberForCompanyId}).
 */
export function alignInvoiceNumberPrefix(
  invoiceNumber: string,
  profile: UserProfile,
  _previousCompanyId: string | null | undefined,
  newCompanyId: string,
): string {
  return ensureInvoiceNumberForCompanyId(invoiceNumber, profile, newCompanyId);
}

/**
 * Ensures the invoice number includes the profile prefix for the company that matches
 * the invoice seller GSTIN (so PDF preview/download stay aligned with Profile prefixes).
 */
export function ensureInvoiceNumberForSeller(
  invoiceNumber: string,
  profile: UserProfile,
  sellerGstin: string,
): string {
  const p = ensureUserProfileDefaults(profile);
  const g = sellerGstin.trim().toUpperCase();
  const company = p.companies.find((c) => c.seller.gstin.trim().toUpperCase() === g);
  const cid = company?.id ?? p.defaultCompanyId;
  return ensureInvoiceNumberForCompanyId(invoiceNumber, profile, cid);
}
