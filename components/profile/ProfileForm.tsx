"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Controller, FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { FormSection } from "@/components/invoice/FormSection";
import { CompanyPresetEditor } from "@/components/profile/CompanyPresetEditor";
import { DEFAULT_USER_PROFILE } from "@/lib/profile/profileStorage";
import { fetchProfileBundle, saveProfileBundle } from "@/lib/storage/storageApi";
import { userProfileSchema, type UserProfile } from "@/lib/invoice/userProfile";

function labelClass() {
  return "block text-xs font-medium text-zinc-600";
}

function inputClass() {
  return "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400";
}

export function ProfileForm() {
  const [saved, setSaved] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const methods = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema) as Resolver<UserProfile>,
    defaultValues: DEFAULT_USER_PROFILE,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = methods;

  const companiesWatch = useWatch({ control, name: "companies" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      try {
        const bundle = await fetchProfileBundle();
        if (cancelled) return;
        reset(bundle.userProfile);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Could not load profile");
        reset(DEFAULT_USER_PROFILE);
      } finally {
        if (!cancelled) setMounted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const bundle = await fetchProfileBundle();
      const active =
        bundle.activeCompanyId && data.companies.some((c) => c.id === bundle.activeCompanyId)
          ? bundle.activeCompanyId
          : data.defaultCompanyId;
      await saveProfileBundle({
        version: 1,
        userProfile: data,
        activeCompanyId: active,
      });
      setLoadError(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("e-bill-profile-updated"));
      }
      setSaved("Profile saved.");
      reset(data);
    } catch (e) {
      setSaved(null);
      setLoadError(e instanceof Error ? e.message : "Save failed");
    }
  });

  const restoreDefaults = useCallback(async () => {
    try {
      await saveProfileBundle({
        version: 1,
        userProfile: DEFAULT_USER_PROFILE,
        activeCompanyId: DEFAULT_USER_PROFILE.defaultCompanyId,
      });
      reset(DEFAULT_USER_PROFILE);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("e-bill-profile-updated"));
      }
      setSaved("Reset to starter two-company profile. Edit and save when ready.");
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Reset failed");
    }
  }, [reset]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(null), 4000);
    return () => clearTimeout(t);
  }, [saved]);

  if (!mounted) {
    return (
      <p className="mx-auto max-w-3xl px-3 py-10 text-sm text-zinc-600 sm:px-4">Loading profile…</p>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Profile</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Two company profiles — pick which one issues each invoice on the invoice page. Shared
              default tax settings apply to both until you change them here.{" "}
              <Link href="/bill" className="font-medium text-zinc-900 underline underline-offset-2">
                Back to invoice
              </Link>
            </p>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {loadError}
          </div>
        )}

        {saved && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
          >
            {saved}
          </div>
        )}

        <CompanyPresetEditor index={0} title="Company 1" />
        <CompanyPresetEditor index={1} title="Company 2" />

        <FormSection id="profile-default-issuer" title="Default issuer for new invoices">
          <p className="mb-3 text-xs text-zinc-600">
            Used when you clear the draft or after downloading a PDF. You can still switch issuer on
            the invoice page for each bill.
          </p>
          <label className={labelClass()}>Start new bills as</label>
          <select {...register("defaultCompanyId")} className={inputClass()}>
            {(companiesWatch ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.defaultCompanyId && (
            <p className="mt-1 text-xs text-red-600">{errors.defaultCompanyId.message}</p>
          )}
        </FormSection>

        <FormSection id="profile-tax" title="Default tax & place of supply (shared)">
          <p className="mb-3 text-xs text-zinc-600">
            GST %, reverse charge, other charges, and round-off apply to every invoice. On the invoice
            page, place of supply follows the <strong>selected company&apos;s seller state</strong> (set
            under each company above). The place of supply fields here are a fallback if that state is
            empty, and IGST vs CGST/SGST is picked automatically when bill-to state is filled.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Place of supply (state)</label>
              <input {...register("invoiceTaxDefaults.placeOfSupplyState")} className={inputClass()} />
              {errors.invoiceTaxDefaults?.placeOfSupplyState && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.invoiceTaxDefaults.placeOfSupplyState.message}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass()}>Place of supply (code)</label>
              <input
                {...register("invoiceTaxDefaults.placeOfSupplyCode")}
                className={inputClass()}
                maxLength={2}
              />
              {errors.invoiceTaxDefaults?.placeOfSupplyCode && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.invoiceTaxDefaults.placeOfSupplyCode.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Controller
                name="invoiceTaxDefaults.reverseCharge"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="profile-rc"
                    className="h-4 w-4 rounded border-zinc-400"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              <label htmlFor="profile-rc" className="text-sm text-zinc-800">
                Reverse charge (default)
              </label>
            </div>
            <div>
              <label className={labelClass()}>Tax</label>
              <select {...register("invoiceTaxDefaults.taxMode")} className={inputClass()}>
                <option value="IGST">IGST</option>
                <option value="CGST_SGST">CGST + SGST</option>
              </select>
            </div>
            <div>
              <label className={labelClass()}>GST %</label>
              <input
                type="number"
                step="0.01"
                {...register("invoiceTaxDefaults.gstPercent")}
                className={inputClass()}
              />
              {errors.invoiceTaxDefaults?.gstPercent && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.invoiceTaxDefaults.gstPercent.message}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass()}>Default other charges (₹)</label>
              <input
                type="number"
                step="any"
                {...register("invoiceTaxDefaults.extraCharges")}
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Label for other charges</label>
              <input {...register("invoiceTaxDefaults.extraChargesLabel")} className={inputClass()} />
            </div>
            <div>
              <label className={labelClass()}>Default round off (₹)</label>
              <input
                type="number"
                step="any"
                {...register("invoiceTaxDefaults.roundOff")}
                className={inputClass()}
              />
            </div>
          </div>
        </FormSection>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save profile
          </button>
          <button
            type="button"
            onClick={() => void restoreDefaults()}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Restore starter profile
          </button>
        </div>

        {isDirty && <p className="text-xs text-amber-800">You have unsaved changes.</p>}
      </form>
    </FormProvider>
  );
}
