"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  ChevronRight,
  FileText,
  History,
  ListOrdered,
  Receipt,
  Truck,
  User,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormState,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { computeInvoiceTotals } from "@/lib/invoice/calculations";
import { fetchInvoicePdf } from "@/lib/invoice/fetchInvoicePdf";
import { invoiceSchema, type InvoiceFormInput, type Party } from "@/lib/invoice/schema";
import { applyProfileToInvoice } from "@/lib/profile/applyProfileToInvoice";
import type { UserProfile } from "@/lib/invoice/userProfile";
import {
  alignInvoiceNumberPrefix,
  DEFAULT_USER_PROFILE,
  ensureInvoiceNumberForCompanyId,
  ensureUserProfileDefaults,
  joinInvoiceNumberTail,
  resolveActiveCompanyId,
  splitInvoiceNumberTail,
} from "@/lib/profile/profileStorage";
import {
  clearDraftRemote,
  createBill,
  fetchBill,
  fetchBills,
  fetchDraft,
  fetchProfileBundle,
  pushRecentBillToParty,
  saveDraft,
  saveProfileActiveCompanyId,
  updateBill,
} from "@/lib/storage/storageApi";
import {
  firstInvoiceErrorSectionId,
  INVOICE_SECTION,
  scrollToInvoiceSection,
} from "@/lib/invoice/invoiceFormNav";
import {
  buildBillFormDefaults,
  formStateForNextBill,
  normalizeLoadedInvoiceForm,
} from "./defaultValues";
import {
  AppLink,
  Banner,
  Box,
  Button,
  Checkbox,
  Dd,
  Dl,
  Dt,
  Field,
  Form,
  Grid,
  Heading,
  Iframe,
  Input,
  Label,
  Main,
  Option,
  Row,
  Section,
  Select,
  Span,
  Stack,
  Strong,
  Text,
  TextArea,
} from "@/components/ui";
import { fieldLabelClass } from "@/components/ui/tokens";
import { FormSection } from "./FormSection";
import { LineItemsEditor } from "./LineItemsEditor";

function formatInr(n: number) {
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function billToPartyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const a = parts[0]![0] ?? "";
  const b = parts[parts.length - 1]![0] ?? "";
  return `${a}${b}`.toUpperCase() || "?";
}

/** Right column: saved bill-to parties to pick from (desktop) or below form (mobile). */
const BillToRecentColumn = memo(function BillToRecentColumn({
  parties,
  onPick,
}: {
  parties: Party[];
  onPick: (p: Party) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return parties;
    return parties.filter((p) =>
      [p.name, p.gstin, p.stateName, p.stateCode].some((x) => String(x).toLowerCase().includes(t)),
    );
  }, [parties, q]);

  return (
    <Box
      role="region"
      aria-label="Saved bill-to customers"
      className="flex flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 shadow-sm"
    >
      <Row className="mb-2 items-start justify-between gap-2 border-b border-zinc-200/80 pb-2">
        <Stack gap="xs" className="min-w-0">
          <Heading level={3} className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Pick saved customer
          </Heading>
          <Text className="text-[11px] leading-snug text-zinc-500">
            Tap a row to copy that party into the bill-to fields.
          </Text>
        </Stack>
        {parties.length > 0 ? (
          <Span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-700 ring-1 ring-zinc-200">
            {parties.length}
          </Span>
        ) : null}
      </Row>

      {parties.length > 0 ? (
        <Box className="mb-2">
          <Label className="sr-only" htmlFor="recent-billto-filter">
            Filter saved customers
          </Label>
          <Input
            id="recent-billto-filter"
            type="search"
            placeholder="Search name, GSTIN, state…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-0 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400"
          />
        </Box>
      ) : null}

      {parties.length === 0 ? (
        <Box className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-white/60 px-3 py-4 text-center">
          <History className="h-5 w-5 text-zinc-300" aria-hidden />
          <Text className="text-[11px] leading-relaxed text-zinc-600">
            None yet. After you <Strong className="font-medium text-zinc-800">save</Strong> or{" "}
            <Strong className="font-medium text-zinc-800">download a PDF</Strong>, customers you billed appear
            here.
          </Text>
        </Box>
      ) : filtered.length === 0 ? (
        <Text className="rounded-lg border border-dashed border-zinc-200 bg-white/60 px-3 py-4 text-center text-[11px] text-zinc-600">
          No matches for &quot;{q.trim()}&quot;.
        </Text>
      ) : (
        <Box className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <Stack gap="none" className="divide-y divide-zinc-100">
            {filtered.map((p) => (
              <button
                key={p.gstin}
                type="button"
                aria-label={`Use ${p.name}, GSTIN ${p.gstin}, ${p.stateName}`}
                title={`${p.name}\n${p.gstin}\n${p.stateName} (${p.stateCode})`}
                className="flex w-full items-center gap-2.5 px-2 py-2 text-left transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-300 sm:gap-2.5 sm:px-2.5 sm:py-2"
                onClick={() => onPick(p)}
              >
                <Span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-700"
                  aria-hidden
                >
                  {billToPartyInitials(p.name)}
                </Span>
                <Box className="min-w-0 flex-1">
                  <Span className="line-clamp-2 block text-[13px] font-medium leading-snug text-zinc-900">
                    {p.name}
                  </Span>
                  <Row className="mt-0.5 min-w-0 items-baseline gap-x-1 text-[10px]" gap="none" wrap>
                    <Span className="font-mono tabular-nums text-zinc-500">{p.gstin}</Span>
                    <Span className="text-zinc-300">·</Span>
                    <Span className="min-w-0 truncate text-zinc-600">{p.stateName}</Span>
                    <Span className="shrink-0 tabular-nums text-zinc-400">({p.stateCode})</Span>
                  </Row>
                </Box>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" aria-hidden />
              </button>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
});

const IssuerSelect = memo(function IssuerSelect({
  profile,
  activeCompanyId,
  onChangeCompany,
}: {
  profile: UserProfile;
  activeCompanyId: string;
  onChangeCompany: (id: string) => void;
}) {
  return (
    <FormSection id="section-issuer" title="Issue this bill as" dense leading={<Building2 aria-hidden />}>
      <Label>Company (seller on PDF)</Label>
      <Select value={activeCompanyId} onChange={(e) => onChangeCompany(e.target.value)}>
        {profile.companies.map((c) => (
          <Option key={c.id} value={c.id}>
            {c.label}
          </Option>
        ))}
      </Select>
      <Text caption className="mt-1.5">
        Seller details in{" "}
        <AppLink href="/profile" className="font-medium text-zinc-800 underline underline-offset-2">
          Profile
        </AppLink>
        .
      </Text>
    </FormSection>
  );
});

function ReadOnlyBlock({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  const titleId = id ? `${id}-title` : undefined;
  return (
    <Section id={id} aria-labelledby={titleId} className="scroll-mt-16 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4">
      <Row
        className="mb-1.5 flex-col items-start border-b border-zinc-200 pb-1.5 sm:flex-row sm:items-center sm:justify-between"
        gap="xs"
      >
        <Heading level={2} id={titleId} className="text-sm font-semibold text-zinc-900">
          {title}
        </Heading>
        <AppLink
          href="/profile"
          className="shrink-0 text-xs font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
        >
          Edit in Profile
        </AppLink>
      </Row>
      <Box className="text-sm text-zinc-800">{children}</Box>
    </Section>
  );
}

export function InvoiceForm({ editBillId }: { editBillId?: string }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [draftNotice, setDraftNotice] = useState<"idle" | "pending" | "saving" | "saved">("idle");
  const [duplicateInvoiceMsg, setDuplicateInvoiceMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [workspace, setWorkspace] = useState<{
    profile: UserProfile;
    activeCompanyId: string;
  } | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dupCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInit = useRef(false);

  const methods = useForm<InvoiceFormInput>({
    resolver: zodResolver(invoiceSchema) as Resolver<InvoiceFormInput>,
    defaultValues: buildBillFormDefaults(
      DEFAULT_USER_PROFILE,
      DEFAULT_USER_PROFILE.defaultCompanyId,
    ),
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = methods;

  const duplicateInvoiceBlocked = Boolean(duplicateInvoiceMsg);

  const { isDirty } = useFormState({ control });
  const invoiceNumberWatch = useWatch({ control, name: "invoiceNumber" });

  const lineItemsWatch = useWatch({ control, name: "lineItems" });
  const [
    taxModeWatch,
    gstPercentWatch,
    extraChargesWatch,
    roundOffWatch,
    sellerWatch,
    posStateWatch,
    posCodeWatch,
    reverseWatch,
    extraLabelWatch,
    shipSame,
  ] = useWatch({
    control,
    name: [
      "taxMode",
      "gstPercent",
      "extraCharges",
      "roundOff",
      "seller",
      "placeOfSupplyState",
      "placeOfSupplyCode",
      "reverseCharge",
      "extraChargesLabel",
      "shipSameAsBill",
    ],
  });

  const totalsPreview = useMemo(() => {
    if (!lineItemsWatch?.length) return null;
    try {
      return computeInvoiceTotals(
        lineItemsWatch,
        taxModeWatch ?? "IGST",
        Number(gstPercentWatch) || 0,
        Number(extraChargesWatch) || 0,
        Number(roundOffWatch) || 0,
      );
    } catch {
      return null;
    }
  }, [
    lineItemsWatch,
    taxModeWatch,
    gstPercentWatch,
    extraChargesWatch,
    roundOffWatch,
  ]);

  const recentBillTo = useMemo(() => {
    if (!workspace) return [] as Party[];
    return ensureUserProfileDefaults(workspace.profile).recentBillTo;
  }, [workspace]);

  const applyRecentBillTo = useCallback(
    (party: Party) => {
      setValue("billTo", party, { shouldValidate: true, shouldDirty: true });
      void trigger("billTo");
      scrollToInvoiceSection(INVOICE_SECTION.billTo);
      requestAnimationFrame(() => {
        document.getElementById("billto-name-field")?.focus();
      });
    },
    [setValue, trigger],
  );

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    void (async () => {
      try {
        const bundle = await fetchProfileBundle();
        const profile = ensureUserProfileDefaults(bundle.userProfile);
        const activeCompanyId = resolveActiveCompanyId(profile, bundle.activeCompanyId);
        setWorkspace({ profile, activeCompanyId });

        let merged = buildBillFormDefaults(profile, activeCompanyId);
        if (editBillId) {
          const bill = await fetchBill(editBillId);
          merged = normalizeLoadedInvoiceForm(
            applyProfileToInvoice(bill.invoice, profile, activeCompanyId),
          );
        } else {
          const draft = await fetchDraft();
          if (draft) {
            merged = normalizeLoadedInvoiceForm(
              applyProfileToInvoice(draft, profile, activeCompanyId),
            );
          }
        }
        reset(merged);
        void trigger();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Could not load workspace");
        const profile = ensureUserProfileDefaults(DEFAULT_USER_PROFILE);
        const activeCompanyId = profile.defaultCompanyId;
        setWorkspace({ profile, activeCompanyId });
        reset(buildBillFormDefaults(profile, activeCompanyId));
        void trigger();
      } finally {
        setReady(true);
      }
    })();
  }, [reset, trigger, editBillId]);

  useEffect(() => {
    const onProfile = async () => {
      try {
        const bundle = await fetchProfileBundle();
        const profile = ensureUserProfileDefaults(bundle.userProfile);
        const activeCompanyId = resolveActiveCompanyId(profile, bundle.activeCompanyId);
        setWorkspace({ profile, activeCompanyId });
        reset(
          normalizeLoadedInvoiceForm(
            applyProfileToInvoice(getValues(), profile, activeCompanyId),
          ),
        );
        void trigger();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("e-bill-profile-updated", onProfile);
    return () => window.removeEventListener("e-bill-profile-updated", onProfile);
  }, [reset, getValues, trigger]);

  useEffect(() => {
    const { unsubscribe } = watch(() => {
      setDraftNotice("pending");
      if (draftTimer.current) clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => {
        const data = getValues();
        const r = invoiceSchema.safeParse(data);
        if (!r.success) {
          setDraftNotice("idle");
          return;
        }
        setDraftNotice("saving");
        void (async () => {
          try {
            await saveDraft(r.data);
            setDraftNotice("saved");
            setTimeout(() => setDraftNotice("idle"), 2200);
          } catch {
            setDraftNotice("idle");
          }
        })();
      }, 700);
    });
    return () => {
      unsubscribe();
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [watch, getValues]);

  useEffect(() => {
    if (!workspace) return;
    if (dupCheckTimer.current) clearTimeout(dupCheckTimer.current);
    dupCheckTimer.current = setTimeout(() => {
      void (async () => {
        const raw = (invoiceNumberWatch ?? "").trim();
        const gst = (sellerWatch?.gstin ?? "").trim().toUpperCase();
        if (!raw || !gst) {
          setDuplicateInvoiceMsg(null);
          return;
        }
        try {
          const bills = await fetchBills();
          const key = raw.toLowerCase();
          const hit = bills.find(
            (b) =>
              b.invoice.seller.gstin.trim().toUpperCase() === gst &&
              b.invoice.invoiceNumber.trim().toLowerCase() === key &&
              b.id !== editBillId,
          );
          setDuplicateInvoiceMsg(
            hit
              ? `This invoice number is already saved for this company${hit.title ? ` (“${hit.title}”)` : ""}. Change the suffix or open that bill.`
              : null,
          );
        } catch {
          setDuplicateInvoiceMsg(null);
        }
      })();
    }, 450);
    return () => {
      if (dupCheckTimer.current) clearTimeout(dupCheckTimer.current);
    };
  }, [invoiceNumberWatch, workspace, editBillId, sellerWatch?.gstin]);

  /** Keeps invoice no. aligned with the selected issuer’s Profile prefix (same rules as PDF). */
  const reconcileInvoiceNumber = useCallback(
    (data: InvoiceFormInput): InvoiceFormInput => {
      if (!workspace) return data;
      const invoiceNumber = ensureInvoiceNumberForCompanyId(
        data.invoiceNumber,
        workspace.profile,
        workspace.activeCompanyId,
      );
      if (invoiceNumber !== data.invoiceNumber) {
        setValue("invoiceNumber", invoiceNumber, { shouldValidate: true });
      }
      return { ...data, invoiceNumber };
    },
    [workspace, setValue],
  );

  const dismissSuccess = useCallback(() => setSuccessMsg(null), []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(dismissSuccess, 4000);
    return () => clearTimeout(t);
  }, [successMsg, dismissSuccess]);

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewError(null);
    setPdfPreviewOpen(false);
  }, []);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    },
    [],
  );

  const resetToSample = useCallback(async () => {
    try {
      await clearDraftRemote();
      const bundle = await fetchProfileBundle();
      const profile = ensureUserProfileDefaults(bundle.userProfile);
      const activeCompanyId = resolveActiveCompanyId(profile, bundle.activeCompanyId);
      setWorkspace({ profile, activeCompanyId });
      reset(buildBillFormDefaults(profile, activeCompanyId));
      void trigger();
      setSubmitError(null);
      setSuccessMsg(null);
      clearPreview();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not clear draft");
    }
  }, [reset, trigger, clearPreview]);

  const onChangeIssuer = useCallback(
    async (id: string) => {
      if (!workspace) return;
      const prevCompanyId = workspace.activeCompanyId;
      try {
        await saveProfileActiveCompanyId(id);
        const bundle = await fetchProfileBundle();
        const profile = ensureUserProfileDefaults(bundle.userProfile);
        const activeCompanyId = resolveActiveCompanyId(profile, bundle.activeCompanyId);
        setWorkspace({ profile, activeCompanyId });
        reset(
          normalizeLoadedInvoiceForm(
            applyProfileToInvoice(getValues(), profile, activeCompanyId),
          ),
        );
        const invAligned = alignInvoiceNumberPrefix(
          getValues("invoiceNumber") ?? "",
          profile,
          prevCompanyId,
          activeCompanyId,
        );
        setValue("invoiceNumber", invAligned, { shouldValidate: true });
        void trigger();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Could not switch company");
      }
    },
    [workspace, reset, getValues, setValue, trigger],
  );

  const onInvalid = useCallback((errs: FieldErrors<InvoiceFormInput>) => {
    const id = firstInvoiceErrorSectionId(errs);
    if (id) scrollToInvoiceSection(id);
  }, []);

  const onPreview = handleSubmit(
    async (data) => {
      const payload = reconcileInvoiceNumber(data);
      setPreviewError(null);
      setSubmitError(null);
      setPreviewLoading(true);
      try {
        const { blob } = await fetchInvoicePdf(payload, "inline");
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = URL.createObjectURL(blob);
        setPreviewUrl(previewUrlRef.current);
        setPdfPreviewOpen(true);
      } catch (e) {
        setPreviewError(e instanceof Error ? e.message : "Could not generate preview");
      } finally {
        setPreviewLoading(false);
      }
    },
    onInvalid,
  );

  /** Opens the preview panel; generates PDF only when there is no preview yet. */
  const ensurePdfPreview = useCallback(() => {
    setPdfPreviewOpen(true);
    if (!previewUrl) void onPreview();
  }, [previewUrl, onPreview]);

  const onUpdateSavedBill = handleSubmit(
    async (data) => {
      if (!editBillId) return;
      const payload = reconcileInvoiceNumber(data);
      setUpdateLoading(true);
      setSubmitError(null);
      try {
        await updateBill(
          editBillId,
          payload,
          `${payload.invoiceNumber} — ${payload.billTo.name}`,
        );
        await pushRecentBillToParty(payload.billTo).catch(() => {});
        const bundle = await fetchProfileBundle();
        const profile = ensureUserProfileDefaults(bundle.userProfile);
        const activeCompanyId = resolveActiveCompanyId(profile, bundle.activeCompanyId);
        setWorkspace({ profile, activeCompanyId });
        setSuccessMsg("Saved bill updated.");
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Update failed");
      } finally {
        setUpdateLoading(false);
      }
    },
    onInvalid,
  );

  const onSubmit = handleSubmit(
    async (data) => {
      const payload = reconcileInvoiceNumber(data);
      setSubmitError(null);
      setSuccessMsg(null);
      setLoading(true);
      try {
        const { blob, filename } = await fetchInvoicePdf(payload, "attachment");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        if (editBillId) {
          await updateBill(
            editBillId,
            payload,
            `${payload.invoiceNumber} — ${payload.billTo.name}`,
          );
        } else {
          await createBill(payload, `${payload.invoiceNumber} — ${payload.billTo.name}`);
        }
        await clearDraftRemote();
        await pushRecentBillToParty(payload.billTo).catch(() => {});
        const bundle = await fetchProfileBundle();
        const profile = ensureUserProfileDefaults(bundle.userProfile);
        const activeCompanyId = resolveActiveCompanyId(profile, bundle.activeCompanyId);
        setWorkspace({ profile, activeCompanyId });
        const next = formStateForNextBill(profile, activeCompanyId);
        reset(next);
        void trigger();
        clearPreview();
        setSuccessMsg(
          editBillId
            ? `PDF downloaded and bill ${filename} updated.`
            : `Saved ${filename}. Bill stored; draft cleared for the next invoice.`,
        );
      } catch (e) {
        setSubmitError(
          e instanceof Error ? e.message : "Network error while generating PDF",
        );
      } finally {
        setLoading(false);
      }
  },
    onInvalid,
  );

  if (!ready || !workspace) {
    return (
      <Text className="mx-auto w-full px-3 py-16 text-center text-sm text-zinc-600 sm:px-4">
        Loading invoice workspace…
      </Text>
    );
  }

  return (
    <FormProvider {...methods}>
      <Main className="min-w-0 w-full pb-[calc(9rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(10rem+env(safe-area-inset-bottom,0px))]">
        <Grid
          columns="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19rem]"
          gap="lg"
          className="mx-auto w-full px-3 sm:px-4 lg:items-start lg:gap-8"
        >
        <Box className="order-2 min-w-0 lg:order-none">
          <Form onSubmit={onSubmit} className="mx-auto w-full space-y-3 lg:mx-0">
            <Row
              className="flex-col border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between"
              gap="md"
            >
              <Stack gap="xs" className="min-w-0">
                <Heading level={1} className="text-xl font-semibold text-zinc-900">
                  {editBillId ? "Edit saved bill" : "GST invoice"}
                </Heading>
                {draftNotice !== "idle" && isDirty ? (
                  <Text
                    caption
                    className="text-zinc-500"
                    role="status"
                    aria-live="polite"
                  >
                    {draftNotice === "pending"
                      ? "Draft will save when the form is valid…"
                      : draftNotice === "saving"
                        ? "Saving draft…"
                        : "Draft saved"}
                  </Text>
                ) : null}
              </Stack>
              <Row className="flex-wrap" gap="sm">
                {editBillId ? (
                  <AppLink
                    href="/bill"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
                  >
                    New invoice
                  </AppLink>
                ) : null}
                <Button type="button" variant="outline" onClick={() => void resetToSample()}>
                  Clear draft
                </Button>
              </Row>
            </Row>

        {successMsg ? (
          <Banner tone="success" role="status" className="flex items-center justify-between gap-2 py-2">
            <Span>{successMsg}</Span>
            <Button
              type="button"
              variant="secondary"
              className="border-0 bg-transparent px-1 py-0 text-xs text-emerald-800 shadow-none hover:bg-emerald-100/40 hover:underline"
              onClick={dismissSuccess}
            >
              Close
            </Button>
          </Banner>
        ) : null}

        <Grid columns="grid-cols-1 lg:grid-cols-2" gap="md" className="lg:items-start">
          <Stack gap="md" className="min-w-0">
            <IssuerSelect
              profile={workspace.profile}
              activeCompanyId={workspace.activeCompanyId}
              onChangeCompany={(id) => void onChangeIssuer(id)}
            />
            <FormSection
              id="section-this-invoice"
              title="This invoice"
              dense
              leading={<Receipt aria-hidden />}
            >
              <Grid columns="grid-cols-1 sm:grid-cols-2" gap="sm">
                <Field>
                  <Label htmlFor="invoice-number-suffix" className={fieldLabelClass}>
                    Invoice no.
                  </Label>
                  <Controller
                    name="invoiceNumber"
                    control={control}
                    render={({ field }) => {
                      const { prefix, suffix } = splitInvoiceNumberTail(
                        field.value ?? "",
                        workspace.profile,
                        workspace.activeCompanyId,
                      );
                      return (
                        <Row
                          gap="none"
                          className="w-full items-stretch overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-sm focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-400"
                        >
                          <Span
                            aria-hidden
                            className="flex shrink-0 items-center self-stretch border-r border-zinc-200 bg-zinc-50 px-2.5 font-mono text-sm font-semibold tabular-nums text-zinc-800"
                          >
                            {prefix}-
                          </Span>
                          <Input
                            id="invoice-number-suffix"
                            className="min-w-0 flex-1 rounded-none border-0 py-2 shadow-none focus-visible:ring-0"
                            value={suffix}
                            onChange={(e) =>
                              field.onChange(joinInvoiceNumberTail(prefix, e.target.value))
                            }
                            onBlur={(e) => {
                              field.onBlur();
                              const full = joinInvoiceNumberTail(prefix, e.target.value);
                              const next = ensureInvoiceNumberForCompanyId(
                                full,
                                workspace.profile,
                                workspace.activeCompanyId,
                              );
                              if (next !== full) {
                                setValue("invoiceNumber", next, { shouldValidate: true });
                              }
                            }}
                            name={field.name}
                            ref={field.ref}
                            placeholder="e.g. 2025-001"
                            autoComplete="off"
                            aria-describedby="invoice-number-prefix-hint"
                          />
                        </Row>
                      );
                    }}
                  />
                  <Text id="invoice-number-prefix-hint" caption className="sr-only">
                    Company prefix to the left is fixed for the selected company; type only the part after the hyphen.
                  </Text>
                  {errors.invoiceNumber ? (
                    <Text className="mt-1 text-xs text-red-600">{errors.invoiceNumber.message}</Text>
                  ) : null}
                  {duplicateInvoiceMsg ? (
                    <Banner tone="warning" role="status" className="mt-2 py-2 text-xs">
                      {duplicateInvoiceMsg}
                    </Banner>
                  ) : null}
                  <Text
                    caption
                    className="mt-0.5 text-[10px] leading-tight"
                    title="Each saved bill needs a unique number. Prefix (UK-/MH-/…) comes from Profile → Invoice menu for that company."
                  >
                    Unique per saved bill · the prefix is fixed from Profile for the company above; only the
                    part after the hyphen is editable.
                  </Text>
                </Field>
                <Field>
                  <Label className={fieldLabelClass}>Date</Label>
                  <Input type="date" {...register("invoiceDate")} />
                  {errors.invoiceDate ? (
                    <Text className="mt-1 text-xs text-red-600">{errors.invoiceDate.message}</Text>
                  ) : null}
                </Field>
              </Grid>
            </FormSection>
          </Stack>

          <ReadOnlyBlock id={INVOICE_SECTION.company} title="Your company">
            {sellerWatch ? (
              <Dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Box className="min-w-0 sm:col-span-2">
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Name</Dt>
                  <Dd className="mt-0.5 break-words font-medium text-zinc-900">{sellerWatch.name}</Dd>
                </Box>
                <Box className="min-w-0 sm:col-span-2">
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Address</Dt>
                  <Dd className="mt-0.5 whitespace-pre-line break-words text-xs leading-snug text-zinc-800">
                    {sellerWatch.address}
                  </Dd>
                </Box>
                <Box className="min-w-0">
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">GSTIN</Dt>
                  <Dd className="mt-0.5 break-all font-mono text-xs tabular-nums text-zinc-900 sm:text-sm">
                    {sellerWatch.gstin}
                  </Dd>
                </Box>
                <Box className="min-w-0">
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">State</Dt>
                  <Dd className="mt-0.5 break-words text-zinc-900">
                    {sellerWatch.stateName} ({sellerWatch.stateCode})
                  </Dd>
                </Box>
                <Box className="min-w-0 sm:col-span-2">
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Phone</Dt>
                  <Dd className="mt-0.5 break-words tabular-nums text-zinc-900">{sellerWatch.phone}</Dd>
                </Box>
                <Box className="min-w-0 sm:col-span-2">
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Email</Dt>
                  <Dd className="mt-0.5 break-all text-zinc-900">{sellerWatch.email}</Dd>
                </Box>
              </Dl>
            ) : (
              <Text muted>Loading…</Text>
            )}
          </ReadOnlyBlock>

          <Box className="min-w-0 lg:col-span-2">
            <ReadOnlyBlock id={INVOICE_SECTION.tax} title="Tax & place of supply">
              <Dl className="flex flex-wrap gap-x-4 gap-y-2 text-sm sm:gap-x-5">
                <Box className="w-full min-w-[8rem] sm:w-auto">
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Place of supply</Dt>
                  <Dd className="mt-0.5 font-medium text-zinc-900">
                    {posStateWatch} ({posCodeWatch})
                  </Dd>
                </Box>
                <Box>
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Tax</Dt>
                  <Dd className="mt-0.5">{taxModeWatch === "CGST_SGST" ? "CGST + SGST" : "IGST"}</Dd>
                </Box>
                <Box>
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">GST %</Dt>
                  <Dd className="mt-0.5 tabular-nums">{gstPercentWatch}</Dd>
                </Box>
                <Box>
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Rev. charge</Dt>
                  <Dd className="mt-0.5">{reverseWatch ? "Yes" : "No"}</Dd>
                </Box>
                <Box>
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Other (₹)</Dt>
                  <Dd className="mt-0.5 tabular-nums">{Number(extraChargesWatch) || 0}</Dd>
                </Box>
                <Box className="min-w-0 w-[min(100%,12rem)] shrink-0">
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Other label</Dt>
                  <Dd className="mt-0.5 truncate">{extraLabelWatch || "—"}</Dd>
                </Box>
                <Box>
                  <Dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Round off</Dt>
                  <Dd className="mt-0.5 tabular-nums">{Number(roundOffWatch) || 0}</Dd>
                </Box>
              </Dl>
            </ReadOnlyBlock>
          </Box>
        </Grid>

        {editBillId ? (
          <Banner tone="warning" className="text-sm">
            Editing bill <Span className="font-mono text-xs">{editBillId}</Span>. Use{" "}
            <Strong>Update saved bill</Strong> to fix mistakes without downloading a PDF, or{" "}
            <Strong>Download PDF</Strong> to regenerate the file and update this record.
          </Banner>
        ) : null}

        <FormSection id="section-billto" title="Bill to" dense leading={<User aria-hidden />}>
          <Grid columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" gap="sm">
            <Field className="sm:col-span-2 lg:col-span-4">
              <Label className={fieldLabelClass}>Name</Label>
              <Input id="billto-name-field" {...register("billTo.name")} />
              {errors.billTo?.name ? (
                <Text className="mt-1 text-xs text-red-600">{errors.billTo.name.message}</Text>
              ) : null}
            </Field>
            <Field className="sm:col-span-2 lg:col-span-4">
              <Label className={fieldLabelClass}>Address</Label>
              <TextArea rows={2} {...register("billTo.address")} />
              {errors.billTo?.address ? (
                <Text className="mt-1 text-xs text-red-600">{errors.billTo.address.message}</Text>
              ) : null}
            </Field>
            <Field className="lg:col-span-2">
              <Label className={fieldLabelClass}>GSTIN</Label>
              <Input {...register("billTo.gstin")} maxLength={15} inputMode="text" autoCapitalize="characters" />
              {errors.billTo?.gstin ? (
                <Text className="mt-1 text-xs text-red-600">{errors.billTo.gstin.message}</Text>
              ) : null}
              <Text caption className="mt-1 text-[10px] leading-snug text-zinc-500">
                15-character GSTIN (state code + PAN entity + checksum). Wrong GSTIN breaks e-invoice matching.
              </Text>
            </Field>
            <Field className="lg:col-span-2">
              <Label className={fieldLabelClass}>PAN (optional)</Label>
              <Input {...register("billTo.pan")} maxLength={10} />
              {errors.billTo?.pan ? (
                <Text className="mt-1 text-xs text-red-600">{errors.billTo.pan.message}</Text>
              ) : null}
            </Field>
            <Field className="lg:col-span-2">
              <Label className={fieldLabelClass}>State</Label>
              <Input {...register("billTo.stateName")} />
              {errors.billTo?.stateName ? (
                <Text className="mt-1 text-xs text-red-600">{errors.billTo.stateName.message}</Text>
              ) : null}
            </Field>
            <Field className="lg:col-span-2">
              <Label className={fieldLabelClass}>State code</Label>
              <Input {...register("billTo.stateCode")} maxLength={2} />
              {errors.billTo?.stateCode ? (
                <Text className="mt-1 text-xs text-red-600">{errors.billTo.stateCode.message}</Text>
              ) : null}
            </Field>
            <Field className="sm:col-span-1 lg:col-span-2">
              <Label className={fieldLabelClass}>Mobile (optional)</Label>
              <Input {...register("billTo.mobile")} />
            </Field>
            <Field className="sm:col-span-1 lg:col-span-2">
              <Label className={fieldLabelClass}>Kind attention (optional)</Label>
              <Input {...register("billTo.kindAttn")} />
            </Field>
          </Grid>
        </FormSection>

        <FormSection id="section-shipto" title="Ship to" dense leading={<Truck aria-hidden />}>
          <Row className="mb-2" gap="sm">
            <Controller
              name="shipSameAsBill"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="ship-same"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
            <Label htmlFor="ship-same" className="text-sm font-normal text-zinc-800">
              Same as bill to
            </Label>
          </Row>
          {!shipSame ? (
            <Grid columns="grid-cols-1 sm:grid-cols-2" gap="sm">
              <Field className="sm:col-span-2">
                <Label className={fieldLabelClass}>Name</Label>
                <Input {...register("shipTo.name")} />
              </Field>
              <Field className="sm:col-span-2">
                <Label className={fieldLabelClass}>Address</Label>
                <TextArea rows={2} {...register("shipTo.address")} />
              </Field>
              <Field>
                <Label className={fieldLabelClass}>GSTIN</Label>
                <Input {...register("shipTo.gstin")} maxLength={15} autoCapitalize="characters" />
                <Text caption className="mt-1 text-[10px] leading-snug text-zinc-500">
                  Use the ship-to party&apos;s GSTIN when goods are delivered to a different registered entity.
                </Text>
              </Field>
              <Field>
                <Label className={fieldLabelClass}>State</Label>
                <Input {...register("shipTo.stateName")} />
              </Field>
              <Field>
                <Label className={fieldLabelClass}>State code</Label>
                <Input {...register("shipTo.stateCode")} maxLength={2} />
              </Field>
              {errors.shipTo ? (
                <Text className="sm:col-span-2 text-sm text-red-600">{errors.shipTo.message}</Text>
              ) : null}
            </Grid>
          ) : null}
        </FormSection>

        <FormSection id="section-lines" title="Line items" dense leading={<ListOrdered aria-hidden />}>
          <LineItemsEditor />
        </FormSection>

        <Section
          id={INVOICE_SECTION.preview}
          aria-labelledby="pdf-preview-heading"
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm"
        >
          {!pdfPreviewOpen ? (
            <Row className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" gap="sm">
              <Stack gap="xs" className="min-w-0 flex-1">
                <Heading level={2} id="pdf-preview-heading" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <FileText className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                  PDF preview
                </Heading>
                <Text caption className="mt-0.5">
                  Collapsed by default. Open when you want to check the layout (form must be valid).
                </Text>
              </Stack>
              <Row className="shrink-0 flex-wrap" gap="sm">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void ensurePdfPreview()}
                  disabled={!isValid || previewLoading || loading || duplicateInvoiceBlocked}
                >
                  {previewLoading ? "Generating…" : "Open PDF preview"}
                </Button>
              </Row>
            </Row>
          ) : (
            <>
              <Row className="mb-2 flex-col sm:flex-row sm:items-center sm:justify-between" gap="sm">
                <Stack gap="xs" className="min-w-0 flex-1">
                  <Heading level={2} id="pdf-preview-heading" className="text-sm font-semibold text-zinc-900">
                    PDF preview
                  </Heading>
                  <Text caption className="mt-0.5">
                    Same layout as the downloaded PDF.
                  </Text>
                </Stack>
                <Row className="shrink-0 flex-wrap" gap="sm">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void onPreview()}
                    disabled={!isValid || previewLoading || loading || duplicateInvoiceBlocked}
                  >
                    {previewLoading ? "Generating…" : "Refresh preview"}
                  </Button>
                  {previewUrl ? (
                    <Button type="button" variant="outline" onClick={clearPreview}>
                      Hide preview
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={() => setPdfPreviewOpen(false)}>
                    Collapse
                  </Button>
                </Row>
              </Row>
              {previewError ? (
                <Banner tone="error" role="alert" className="mb-3">
                  {previewError}
                </Banner>
              ) : null}
              {previewUrl ? (
                <Iframe
                  title="Invoice PDF preview"
                  src={previewUrl}
                  className="h-[min(58vh,560px)] w-full rounded-lg border border-zinc-300 bg-white"
                />
              ) : (
                <Box className="flex h-28 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white px-2 text-center text-xs text-zinc-500 sm:text-sm">
                  No preview yet — use Refresh preview when the form is valid.
                </Box>
              )}
            </>
          )}
        </Section>

        {editBillId ? (
          <Box className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={!isValid || updateLoading || duplicateInvoiceBlocked}
              onClick={onUpdateSavedBill}
              className="border-zinc-400"
            >
              {updateLoading ? "Saving…" : "Update saved bill"}
            </Button>
          </Box>
        ) : null}

        {submitError ? (
          <Banner tone="error" role="alert">
            {submitError}
          </Banner>
        ) : null}

        <Box className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-3 pt-3 backdrop-blur sm:px-4 sm:pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <Row className="pointer-events-auto mx-auto w-full flex-col sm:flex-row sm:items-center sm:justify-between" gap="sm">
            <Box className="text-sm text-zinc-700">
              {totalsPreview ? (
                <Span className="tabular-nums">
                  Taxable {formatInr(totalsPreview.taxableBase)} · GST{" "}
                  {formatInr(totalsPreview.totalTax)} ·{" "}
                  <Span className="font-semibold text-zinc-900">{formatInr(totalsPreview.grandTotal)}</Span>
                </Span>
              ) : (
                <Span className="text-zinc-500">Add lines for total</Span>
              )}
            </Box>
            <Row className="w-full flex-col sm:w-auto sm:flex-row" gap="sm">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => void ensurePdfPreview()}
                disabled={!isValid || previewLoading || loading || duplicateInvoiceBlocked}
              >
                {previewLoading ? "…" : "Preview PDF"}
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={!isValid || loading || previewLoading || duplicateInvoiceBlocked}
              >
                {loading ? "…" : "Download PDF"}
              </Button>
            </Row>
          </Row>
        </Box>
          </Form>
        </Box>
        <Box
          role="complementary"
          aria-label="Saved bill-to customers"
          className="order-1 min-w-0 lg:order-none lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:border-l lg:border-zinc-200 lg:pl-6"
        >
          <BillToRecentColumn parties={recentBillTo} onPick={(p) => applyRecentBillTo(p)} />
        </Box>
      </Grid>
      </Main>
    </FormProvider>
  );
}
