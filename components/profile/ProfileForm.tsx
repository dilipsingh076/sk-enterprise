"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  MapPin,
  Percent,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { FormSection } from "@/components/invoice/FormSection";
import { CompanyPresetEditor } from "@/components/profile/CompanyPresetEditor";
import {
  AppLink,
  Banner,
  Box,
  Button,
  Checkbox,
  Details,
  Field,
  Form,
  Grid,
  Header,
  Input,
  Label,
  Option,
  Row,
  Section,
  Select,
  Span,
  Stack,
  Strong,
  Summary,
  Text,
  Heading,
} from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { DEFAULT_USER_PROFILE } from "@/lib/profile/profileStorage";
import { fetchProfileBundle, saveProfileBundle } from "@/lib/storage/storageApi";
import { userProfileSchema, type UserProfile } from "@/lib/invoice/userProfile";

export function ProfileForm() {
  const [saved, setSaved] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [companyTab, setCompanyTab] = useState<0 | 1>(0);
  const [taxSectionOpen, setTaxSectionOpen] = useState(true);

  const methods = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema) as Resolver<UserProfile>,
    defaultValues: DEFAULT_USER_PROFILE,
    mode: "onTouched",
    reValidateMode: "onBlur",
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = methods;

  const companiesWatch = useWatch({ control, name: "companies" });
  const label0 = companiesWatch?.[0]?.label?.trim() || "Company 1";
  const label1 = companiesWatch?.[1]?.label?.trim() || "Company 2";
  const gst0 = companiesWatch?.[0]?.seller?.gstin?.trim() || "—";
  const gst1 = companiesWatch?.[1]?.seller?.gstin?.trim() || "—";
  const st0 = companiesWatch?.[0]?.seller?.stateCode?.trim() || "—";
  const st1 = companiesWatch?.[1]?.seller?.stateCode?.trim() || "—";

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
      <Row className="mx-auto w-full items-center px-3 py-16 text-sm text-zinc-600 sm:px-4" gap="sm">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-500" aria-hidden />
        <Span>Loading profile…</Span>
      </Row>
    );
  }

  return (
    <FormProvider {...methods}>
      <Form onSubmit={onSubmit} className="mx-auto w-full space-y-4 pb-24">
        <Header className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <Row className="items-start gap-3" gap="md">
            <Box className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
              <Building2 className="h-5 w-5" aria-hidden />
            </Box>
            <Stack gap="xs">
              <Heading level={1} className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
                Company profiles
              </Heading>
              <Text className="mt-0 w-full text-xs leading-relaxed text-zinc-600 sm:text-sm">
                Two separate issuers (different GSTINs and details). Pick one below to edit. Tax defaults
                at the bottom apply to <Span className="font-medium text-zinc-800">both</Span>.{" "}
                <AppLink
                  href="/bill"
                  className="inline-flex items-center gap-0.5 font-medium text-zinc-900 underline underline-offset-2"
                >
                  Open invoice
                </AppLink>
              </Text>
            </Stack>
          </Row>
        </Header>

        {loadError ? (
          <Banner tone="error" role="alert" className="flex items-start gap-2 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <Span>{loadError}</Span>
          </Banner>
        ) : null}

        {saved ? (
          <Banner tone="success" role="status" className="flex items-start gap-2 py-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
            <Span>{saved}</Span>
          </Banner>
        ) : null}

        <Section aria-labelledby="profile-compare-heading" className="space-y-2">
          <Heading level={2} id="profile-compare-heading" className="sr-only">
            Compare the two company profiles
          </Heading>
          <Text className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">At a glance</Text>
          <Grid columns="grid-cols-1 sm:grid-cols-2" gap="sm">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCompanyTab(0)}
              className={cn(
                "h-auto rounded-xl border p-3 text-left transition-all",
                companyTab === 0
                  ? "border-zinc-900 bg-white shadow-md ring-1 ring-zinc-900/10"
                  : "border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 hover:bg-white",
              )}
            >
              <Row className="text-zinc-500" gap="sm">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                <Span className="text-[10px] font-semibold uppercase tracking-wide">Profile A</Span>
              </Row>
              <Text className="mt-1 line-clamp-2 text-sm font-medium text-zinc-900">{label0}</Text>
              <Text className="mt-1 font-mono text-[11px] tabular-nums text-zinc-600">{gst0}</Text>
              <Text caption className="mt-0.5 text-zinc-500">
                State code {st0}
              </Text>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCompanyTab(1)}
              className={cn(
                "h-auto rounded-xl border p-3 text-left transition-all",
                companyTab === 1
                  ? "border-zinc-900 bg-white shadow-md ring-1 ring-zinc-900/10"
                  : "border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 hover:bg-white",
              )}
            >
              <Row className="text-zinc-500" gap="sm">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                <Span className="text-[10px] font-semibold uppercase tracking-wide">Profile B</Span>
              </Row>
              <Text className="mt-1 line-clamp-2 text-sm font-medium text-zinc-900">{label1}</Text>
              <Text className="mt-1 font-mono text-[11px] tabular-nums text-zinc-600">{gst1}</Text>
              <Text caption className="mt-0.5 text-zinc-500">
                State code {st1}
              </Text>
            </Button>
          </Grid>
        </Section>

        <Field>
          <Label htmlFor="profile-company-picker" layout="inline">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            Edit details for
          </Label>
          <Select
            id="profile-company-picker"
            value={String(companyTab)}
            onChange={(e) => setCompanyTab(Number(e.target.value) as 0 | 1)}
            aria-label="Choose which company profile to edit"
          >
            <Option value="0">{label0}</Option>
            <Option value="1">{label1}</Option>
          </Select>
        </Field>

        <Box className={companyTab === 0 ? "block" : "hidden"}>
          <CompanyPresetEditor index={0} title={label0} />
        </Box>
        <Box className={companyTab === 1 ? "block" : "hidden"}>
          <CompanyPresetEditor index={1} title={label1} />
        </Box>

        <FormSection
          id="profile-default-issuer"
          title="Default issuing company"
          dense
          leading={<Building2 className="text-zinc-600" aria-hidden />}
        >
          <Text className="mb-2 flex items-start gap-2 text-[11px] leading-relaxed text-zinc-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
            After you clear the draft or download a PDF, new invoices start with this issuer. You can still
            change it on the invoice page.
          </Text>
          <Label htmlFor="profile-default-company" layout="inline">
            Start new bills as
          </Label>
          <Controller
            name="defaultCompanyId"
            control={control}
            render={({ field }) => (
              <Select
                id="profile-default-company"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                invalid={!!errors.defaultCompanyId}
              >
                {(companiesWatch ?? []).map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.label}
                  </Option>
                ))}
              </Select>
            )}
          />
          {errors.defaultCompanyId ? (
            <Text className="mt-1 text-xs text-red-600">{errors.defaultCompanyId.message}</Text>
          ) : null}
        </FormSection>

        <Details
          className="group scroll-mt-16 rounded-xl border border-zinc-200 bg-white open:shadow-sm"
          open={taxSectionOpen}
          onToggle={(e) => setTaxSectionOpen((e.target as HTMLDetailsElement).open)}
        >
          <Summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 border-b border-transparent px-4 py-3 text-sm font-semibold text-zinc-900 open:border-zinc-100 [&::-webkit-details-marker]:hidden sm:px-5 sm:py-3.5">
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:-rotate-180" aria-hidden />
            <Percent className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            <Span>Shared tax &amp; place of supply</Span>
            <Span className="text-[10px] font-normal uppercase tracking-wide text-zinc-400 sm:ml-auto">
              Both companies
            </Span>
          </Summary>
          <Stack gap="md" className="px-4 pb-4 pt-1 sm:px-5">
            <Details className="rounded-lg bg-zinc-50/80 px-2 py-1">
              <Summary className="cursor-pointer text-[11px] font-medium text-zinc-700 underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
                How this section is used
              </Summary>
              <Text className="mt-2 pb-2 text-[11px] leading-relaxed text-zinc-600">
                GST %, reverse charge, other charges, and round-off apply to every invoice. Place of supply
                usually follows the <Strong>selected company&apos;s</Strong> seller state on the invoice page;
                these fields are a fallback. IGST vs CGST/SGST is inferred when bill-to state is filled.
              </Text>
            </Details>
            <Grid columns="grid-cols-1 sm:grid-cols-2" gap="sm">
              <Field>
                <Label layout="inline">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                  Place of supply (state)
                </Label>
                <Input {...register("invoiceTaxDefaults.placeOfSupplyState")} />
                {errors.invoiceTaxDefaults?.placeOfSupplyState ? (
                  <Text className="mt-1 text-xs text-red-600">
                    {errors.invoiceTaxDefaults.placeOfSupplyState.message}
                  </Text>
                ) : null}
              </Field>
              <Field>
                <Label layout="inline">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                  Place of supply (code)
                </Label>
                <Input {...register("invoiceTaxDefaults.placeOfSupplyCode")} maxLength={2} />
                {errors.invoiceTaxDefaults?.placeOfSupplyCode ? (
                  <Text className="mt-1 text-xs text-red-600">
                    {errors.invoiceTaxDefaults.placeOfSupplyCode.message}
                  </Text>
                ) : null}
              </Field>
              <Row className="items-center sm:col-span-2" gap="sm">
                <Controller
                  name="invoiceTaxDefaults.reverseCharge"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="profile-rc"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
                <Label htmlFor="profile-rc" className="text-sm font-normal text-zinc-800">
                  Reverse charge (default)
                </Label>
              </Row>
              <Field>
                <Label>Tax mode</Label>
                <Controller
                  name="invoiceTaxDefaults.taxMode"
                  control={control}
                  render={({ field }) => (
                    <Select
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      invalid={!!errors.invoiceTaxDefaults?.taxMode}
                    >
                      <Option value="IGST">IGST</Option>
                      <Option value="CGST_SGST">CGST + SGST</Option>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <Label>GST %</Label>
                <Input type="number" step="0.01" {...register("invoiceTaxDefaults.gstPercent")} />
                {errors.invoiceTaxDefaults?.gstPercent ? (
                  <Text className="mt-1 text-xs text-red-600">
                    {errors.invoiceTaxDefaults.gstPercent.message}
                  </Text>
                ) : null}
              </Field>
              <Field>
                <Label>Default other charges (₹)</Label>
                <Input type="number" step="any" {...register("invoiceTaxDefaults.extraCharges")} />
              </Field>
              <Field>
                <Label>Label for other charges</Label>
                <Input {...register("invoiceTaxDefaults.extraChargesLabel")} />
              </Field>
              <Field>
                <Label>Default round off (₹)</Label>
                <Input type="number" step="any" {...register("invoiceTaxDefaults.roundOff")} />
              </Field>
            </Grid>
          </Stack>
        </Details>

        <Row className="flex-col sm:flex-row sm:items-center sm:justify-between" gap="sm">
          <Button type="submit" variant="submit">
            <Save className="h-4 w-4" aria-hidden />
            Save profile
          </Button>
          <Button type="button" variant="iconRow" onClick={() => void restoreDefaults()}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Restore starter profile
          </Button>
        </Row>

        {isDirty ? (
          <Text className="flex items-center gap-1.5 text-xs text-amber-800">
            <Span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
            You have unsaved changes.
          </Text>
        ) : null}
      </Form>
    </FormProvider>
  );
}
