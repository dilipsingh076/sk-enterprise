"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { computeInvoiceTotals } from "@/lib/invoice/calculations";
import { fetchInvoicePdf } from "@/lib/invoice/fetchInvoicePdf";
import { invoiceSchema, type InvoiceFormInput } from "@/lib/invoice/schema";
import { applyProfileToInvoice } from "@/lib/profile/applyProfileToInvoice";
import type { UserProfile } from "@/lib/invoice/userProfile";
import { getSellerForCompanyId, resolveActiveCompanyId } from "@/lib/profile/profileStorage";
import {
  clearDraftRemote,
  createBill,
  fetchBill,
  fetchDraft,
  fetchProfileBundle,
  saveDraft,
  saveProfileActiveCompanyId,
  updateBill,
} from "@/lib/storage/storageApi";
import { DEFAULT_USER_PROFILE } from "@/lib/profile/profileStorage";
import { buildBillFormDefaults, formStateForNextBill } from "./defaultValues";
import { FormSection } from "./FormSection";
import { LineItemsEditor } from "./LineItemsEditor";

function labelClass() {
  return "block text-xs font-medium text-zinc-600";
}

function inputClass() {
  return "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400";
}

function formatInr(n: number) {
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function IssuerSelect({
  profile,
  activeCompanyId,
  onChangeCompany,
}: {
  profile: UserProfile;
  activeCompanyId: string;
  onChangeCompany: (id: string) => void;
}) {
  return (
    <FormSection id="section-issuer" title="Issue this bill as">
      <label className={labelClass()}>Company (seller on PDF)</label>
      <select
        className={inputClass()}
        value={activeCompanyId}
        onChange={(e) => onChangeCompany(e.target.value)}
      >
        {profile.companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-zinc-600">
        Company JSON is stored under{" "}
        <code className="rounded bg-zinc-200 px-1 py-0.5 text-[11px]">data/profile.json</code> locally
        or Vercel Blob when configured. Edit details in{" "}
        <Link href="/profile" className="font-medium text-zinc-900 underline underline-offset-2">
          Profile
        </Link>
        .
      </p>
    </FormSection>
  );
}

function ReadOnlyBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
      <div className="mb-3 flex flex-col gap-2 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <Link
          href="/profile"
          className="shrink-0 text-xs font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
        >
          Edit in Profile
        </Link>
      </div>
      <div className="text-sm text-zinc-800">{children}</div>
    </section>
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
  const [ready, setReady] = useState(false);
  const [workspace, setWorkspace] = useState<{
    profile: UserProfile;
    activeCompanyId: string;
  } | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInit = useRef(false);

  const methods = useForm<InvoiceFormInput>({
    resolver: zodResolver(invoiceSchema) as Resolver<InvoiceFormInput>,
    defaultValues: buildBillFormDefaults(
      DEFAULT_USER_PROFILE,
      DEFAULT_USER_PROFILE.defaultCompanyId,
    ),
    mode: "onChange",
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

  const shipSame = watch("shipSameAsBill");
  const lineItemsWatch = useWatch({ control, name: "lineItems" });
  const taxModeWatch = useWatch({ control, name: "taxMode" });
  const gstPercentWatch = useWatch({ control, name: "gstPercent" });
  const extraChargesWatch = useWatch({ control, name: "extraCharges" });
  const roundOffWatch = useWatch({ control, name: "roundOff" });
  const sellerWatch = useWatch({ control, name: "seller" });
  const posStateWatch = useWatch({ control, name: "placeOfSupplyState" });
  const posCodeWatch = useWatch({ control, name: "placeOfSupplyCode" });
  const reverseWatch = useWatch({ control, name: "reverseCharge" });
  const extraLabelWatch = useWatch({ control, name: "extraChargesLabel" });

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

  useEffect(() => {
    void trigger();
  }, [trigger]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    void (async () => {
      try {
        const bundle = await fetchProfileBundle();
        const profile = bundle.userProfile;
        const activeCompanyId = resolveActiveCompanyId(profile, bundle.activeCompanyId);
        setWorkspace({ profile, activeCompanyId });

        let merged = buildBillFormDefaults(profile, activeCompanyId);
        if (editBillId) {
          const bill = await fetchBill(editBillId);
          merged = applyProfileToInvoice(bill.invoice, profile, activeCompanyId);
        } else {
          const draft = await fetchDraft();
          if (draft) {
            merged = applyProfileToInvoice(draft, profile, activeCompanyId);
          }
        }
        reset(merged);
        void trigger();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Could not load workspace");
        const profile = DEFAULT_USER_PROFILE;
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
        const profile = bundle.userProfile;
        const activeCompanyId = resolveActiveCompanyId(profile, bundle.activeCompanyId);
        setWorkspace({ profile, activeCompanyId });
        reset(applyProfileToInvoice(getValues(), profile, activeCompanyId));
        void trigger();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("e-bill-profile-updated", onProfile);
    return () => window.removeEventListener("e-bill-profile-updated", onProfile);
  }, [reset, getValues, trigger]);

  useEffect(() => {
    const { unsubscribe } = watch((data) => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => {
        const r = invoiceSchema.safeParse(data);
        if (r.success) void saveDraft(r.data).catch(() => {});
      }, 700);
    });
    return () => {
      unsubscribe();
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [watch]);

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
      const profile = bundle.userProfile;
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
      try {
        await saveProfileActiveCompanyId(id);
        const bundle = await fetchProfileBundle();
        const profile = bundle.userProfile;
        const activeCompanyId = resolveActiveCompanyId(profile, bundle.activeCompanyId);
        setWorkspace({ profile, activeCompanyId });
        reset(applyProfileToInvoice(getValues(), profile, activeCompanyId));
        void trigger();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Could not switch company");
      }
    },
    [workspace, reset, getValues, trigger],
  );

  const onPreview = handleSubmit(async (data) => {
    setPreviewError(null);
    setSubmitError(null);
    setPreviewLoading(true);
    try {
      const { blob } = await fetchInvoicePdf(data, "inline");
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(blob);
      setPreviewUrl(previewUrlRef.current);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Could not generate preview");
    } finally {
      setPreviewLoading(false);
    }
  });

  const onUpdateSavedBill = handleSubmit(async (data) => {
    if (!editBillId) return;
    setUpdateLoading(true);
    setSubmitError(null);
    try {
      await updateBill(
        editBillId,
        data,
        `${data.invoiceNumber} — ${data.billTo.name}`,
      );
      setSuccessMsg("Saved bill updated.");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdateLoading(false);
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const { blob, filename } = await fetchInvoicePdf(data, "attachment");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      if (editBillId) {
        await updateBill(
          editBillId,
          data,
          `${data.invoiceNumber} — ${data.billTo.name}`,
        );
      } else {
        await createBill(data, `${data.invoiceNumber} — ${data.billTo.name}`);
      }
      await clearDraftRemote();
      const bundle = await fetchProfileBundle();
      const profile = bundle.userProfile;
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
  });

  if (!ready || !workspace) {
    return (
      <div className="mx-auto max-w-3xl px-3 py-16 text-center text-sm text-zinc-600 sm:px-4">
        Loading invoice workspace…
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5 pb-40">
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">
            {editBillId ? "Edit saved bill" : "GST invoice"}
          </h1>
          <div className="flex flex-wrap gap-2">
            {editBillId ? (
              <Link
                href="/bill"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
              >
                New invoice
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void resetToSample()}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
            >
              Clear draft
            </button>
          </div>
        </div>

        {successMsg && (
          <div
            role="status"
            className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
          >
            <span>{successMsg}</span>
            <button type="button" onClick={dismissSuccess} className="text-xs text-emerald-800 hover:underline">
              Close
            </button>
          </div>
        )}

        <IssuerSelect
          profile={workspace.profile}
          activeCompanyId={workspace.activeCompanyId}
          onChangeCompany={(id) => void onChangeIssuer(id)}
        />

        <FormSection id="section-this-invoice" title="This invoice">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Invoice no.</label>
              <input {...register("invoiceNumber")} className={inputClass()} />
              {errors.invoiceNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.invoiceNumber.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass()}>Date</label>
              <input type="date" {...register("invoiceDate")} className={inputClass()} />
            </div>
          </div>
        </FormSection>

        {editBillId ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Editing bill <span className="font-mono text-xs">{editBillId}</span>. Use{" "}
            <strong>Update saved bill</strong> to fix mistakes without downloading a PDF, or{" "}
            <strong>Download PDF</strong> to regenerate the file and update this record.
          </div>
        ) : null}

        <ReadOnlyBlock title="Your company">
          {sellerWatch ? (
            <dl className="grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Name</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{sellerWatch.name}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Address</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-zinc-800">{sellerWatch.address}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">GSTIN</dt>
                <dd className="mt-0.5 tabular-nums">{sellerWatch.gstin}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">State</dt>
                <dd className="mt-0.5">
                  {sellerWatch.stateName} ({sellerWatch.stateCode})
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</dt>
                <dd className="mt-0.5">{sellerWatch.phone}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</dt>
                <dd className="mt-0.5 break-all">{sellerWatch.email}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-zinc-600">Loading…</p>
          )}
        </ReadOnlyBlock>

        <ReadOnlyBlock title="Tax & place of supply (this invoice)">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Place of supply</dt>
              <dd className="mt-0.5">
                {posStateWatch} ({posCodeWatch})
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tax</dt>
              <dd className="mt-0.5">{taxModeWatch === "CGST_SGST" ? "CGST + SGST" : "IGST"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">GST %</dt>
              <dd className="mt-0.5 tabular-nums">{gstPercentWatch}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Reverse charge</dt>
              <dd className="mt-0.5">{reverseWatch ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Other charges (₹)</dt>
              <dd className="mt-0.5 tabular-nums">{Number(extraChargesWatch) || 0}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Other charges label</dt>
              <dd className="mt-0.5">{extraLabelWatch || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Round off (₹)</dt>
              <dd className="mt-0.5 tabular-nums">{Number(roundOffWatch) || 0}</dd>
            </div>
          </dl>
        </ReadOnlyBlock>

        <FormSection id="section-billto" title="Bill to">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass()}>Name</label>
              <input {...register("billTo.name")} className={inputClass()} />
              {errors.billTo?.name && (
                <p className="mt-1 text-xs text-red-600">{errors.billTo.name.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Address</label>
              <textarea rows={3} {...register("billTo.address")} className={inputClass()} />
              {errors.billTo?.address && (
                <p className="mt-1 text-xs text-red-600">{errors.billTo.address.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass()}>GSTIN</label>
              <input {...register("billTo.gstin")} className={inputClass()} maxLength={15} />
              {errors.billTo?.gstin && (
                <p className="mt-1 text-xs text-red-600">{errors.billTo.gstin.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass()}>PAN (optional)</label>
              <input {...register("billTo.pan")} className={inputClass()} maxLength={10} />
            </div>
            <div>
              <label className={labelClass()}>State</label>
              <input {...register("billTo.stateName")} className={inputClass()} />
              {errors.billTo?.stateName && (
                <p className="mt-1 text-xs text-red-600">{errors.billTo.stateName.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass()}>State code</label>
              <input {...register("billTo.stateCode")} className={inputClass()} maxLength={2} />
              {errors.billTo?.stateCode && (
                <p className="mt-1 text-xs text-red-600">{errors.billTo.stateCode.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass()}>Mobile (optional)</label>
              <input {...register("billTo.mobile")} className={inputClass()} />
            </div>
            <div>
              <label className={labelClass()}>Kind attention (optional)</label>
              <input {...register("billTo.kindAttn")} className={inputClass()} />
            </div>
          </div>
        </FormSection>

        <FormSection id="section-shipto" title="Ship to">
          <div className="mb-3 flex items-center gap-2">
            <Controller
              name="shipSameAsBill"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="ship-same"
                  className="h-4 w-4 rounded border-zinc-400"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
            <label htmlFor="ship-same" className="text-sm text-zinc-800">
              Same as bill to
            </label>
          </div>
          {!shipSame && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass()}>Name</label>
                <input {...register("shipTo.name")} className={inputClass()} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass()}>Address</label>
                <textarea rows={3} {...register("shipTo.address")} className={inputClass()} />
              </div>
              <div>
                <label className={labelClass()}>GSTIN</label>
                <input {...register("shipTo.gstin")} className={inputClass()} maxLength={15} />
              </div>
              <div>
                <label className={labelClass()}>State</label>
                <input {...register("shipTo.stateName")} className={inputClass()} />
              </div>
              <div>
                <label className={labelClass()}>State code</label>
                <input {...register("shipTo.stateCode")} className={inputClass()} maxLength={2} />
              </div>
              {errors.shipTo && (
                <p className="sm:col-span-2 text-sm text-red-600">{errors.shipTo.message}</p>
              )}
            </div>
          )}
        </FormSection>

        <FormSection id="section-lines" title="Line items">
          <LineItemsEditor />
        </FormSection>

        <section
          aria-labelledby="pdf-preview-heading"
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm"
        >
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="pdf-preview-heading" className="text-sm font-semibold text-zinc-900">
              PDF preview
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onPreview()}
                disabled={!isValid || previewLoading || loading}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
              >
                {previewLoading ? "Generating…" : "Refresh preview"}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={clearPreview}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Hide preview
                </button>
              )}
            </div>
          </div>
          <p className="mb-3 text-xs text-zinc-600">
            Generate a preview before downloading. The preview uses the same layout as the PDF file.
          </p>
          {previewError && (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
            >
              {previewError}
            </div>
          )}
          {previewUrl ? (
            <iframe
              title="Invoice PDF preview"
              src={previewUrl}
              className="h-[min(70vh,720px)] w-full rounded-lg border border-zinc-300 bg-white"
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-sm text-zinc-500">
              No preview yet — use Refresh preview when the form is valid.
            </div>
          )}
        </section>

        {editBillId ? (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!isValid || updateLoading}
              onClick={onUpdateSavedBill}
              className="rounded-lg border border-zinc-400 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
            >
              {updateLoading ? "Saving…" : "Update saved bill"}
            </button>
          </div>
        ) : null}

        {submitError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {submitError}
          </div>
        )}

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-4">
          <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-700">
              {totalsPreview ? (
                <span className="tabular-nums">
                  Taxable {formatInr(totalsPreview.taxableBase)} · GST{" "}
                  {formatInr(totalsPreview.totalTax)} ·{" "}
                  <span className="font-semibold text-zinc-900">
                    {formatInr(totalsPreview.grandTotal)}
                  </span>
                </span>
              ) : (
                <span className="text-zinc-500">Add lines for total</span>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => void onPreview()}
                disabled={!isValid || previewLoading || loading}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 sm:w-auto"
              >
                {previewLoading ? "…" : "Preview PDF"}
              </button>
              <button
                type="submit"
                disabled={!isValid || loading || previewLoading}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-300 sm:w-auto"
              >
                {loading ? "…" : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
