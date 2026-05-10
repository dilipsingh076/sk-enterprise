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
    seller: SK_SELLER,
  },
  {
    id: "company-mh",
    label: "PUTZMEISTER INDIA PRIVATE LIMITED",
    seller: SECOND_SELLER,
  },
];

/**
 * Default profile (starter & “Restore starter profile” in UI).
 */
export const DEFAULT_USER_PROFILE: UserProfile = {
  companies: DEFAULT_COMPANIES,
  defaultCompanyId: "company-utk",
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
        seller: leg.data.seller,
      },
      {
        id: "company-mh",
        label: DEFAULT_COMPANIES[1].label,
        seller: DEFAULT_COMPANIES[1].seller,
      },
    ],
    defaultCompanyId: "company-utk",
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
    invoiceTaxDefaults: row.data.invoiceTaxDefaults,
  };
}

/** Normalize raw JSON from disk (any legacy shape) into `UserProfile`. */
export function normalizeStoredUserProfile(raw: unknown): UserProfile {
  const v2 = userProfileSchema.safeParse(raw);
  if (v2.success) return v2.data;
  const coerced = tryCoerceSingleCompanyArray(raw);
  if (coerced) return coerced;
  const migrated = migrateLegacyProfile(raw);
  if (migrated) return migrated;
  return DEFAULT_USER_PROFILE;
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
