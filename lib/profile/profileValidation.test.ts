import { describe, expect, it } from "vitest";
import { userProfileSchema } from "@/lib/invoice/userProfile";
import { DEFAULT_USER_PROFILE } from "@/lib/profile/profileStorage";
import { profileBundleSchema } from "@/lib/storage/serverJsonStore";

describe("profile validation", () => {
  it("default profile passes userProfileSchema", () => {
    const r = userProfileSchema.safeParse(DEFAULT_USER_PROFILE);
    if (!r.success) {
      console.log(JSON.stringify(r.error.issues, null, 2));
    }
    expect(r.success).toBe(true);
  });

  it("default bundle passes profileBundleSchema", () => {
    const r = profileBundleSchema.safeParse({
      version: 1,
      userProfile: DEFAULT_USER_PROFILE,
      activeCompanyId: DEFAULT_USER_PROFILE.defaultCompanyId,
    });
    if (!r.success) {
      console.log(JSON.stringify(r.error.issues, null, 2));
    }
    expect(r.success).toBe(true);
  });
});
