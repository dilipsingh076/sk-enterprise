"use client";

import { useFormContext, type Path } from "react-hook-form";
import { FormSection } from "@/components/invoice/FormSection";
import type { UserProfile } from "@/lib/invoice/userProfile";

function labelClass() {
  return "block text-xs font-medium text-zinc-600";
}

function inputClass() {
  return "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400";
}

function cp(index: 0 | 1, key: string): Path<UserProfile> {
  return `companies.${index}.${key}` as Path<UserProfile>;
}

export function CompanyPresetEditor({
  index,
  title,
}: {
  index: 0 | 1;
  title: string;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<UserProfile>();
  const e0 = errors.companies?.[index];

  return (
    <FormSection id={`profile-company-${index}`} title={title}>
      <input type="hidden" {...register(cp(index, "id"))} />
      <p className="mb-3 text-xs text-zinc-600">
        Menu name appears on the invoice page when choosing which company is issuing this bill.
      </p>
      <div className="mb-4">
        <label className={labelClass()}>Menu name</label>
        <input {...register(cp(index, "label"))} className={inputClass()} />
        {e0?.label && <p className="mt-1 text-xs text-red-600">{e0.label.message}</p>}
      </div>

      <div className="mb-4">
        <label className={labelClass()}>PDF header description</label>
        <input
          {...register(cp(index, "seller.pdfHeaderDescription"))}
          className={inputClass()}
          placeholder="e.g. Engineering, Infrastructure & Construction Works"
        />
        <p className="mt-1 text-[11px] text-zinc-500">
          Shown under the legal name on the downloaded invoice PDF. Leave blank to hide.
        </p>
      </div>

      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">
        Legal &amp; registration
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass()}>Legal name</label>
          <input {...register(cp(index, "seller.name"))} className={inputClass()} />
          {e0?.seller?.name && (
            <p className="mt-1 text-xs text-red-600">{e0.seller.name.message}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Address</label>
          <textarea rows={3} {...register(cp(index, "seller.address"))} className={inputClass()} />
          {e0?.seller?.address && (
            <p className="mt-1 text-xs text-red-600">{e0.seller.address.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass()}>GSTIN</label>
          <input {...register(cp(index, "seller.gstin"))} className={inputClass()} maxLength={15} />
          {e0?.seller?.gstin && (
            <p className="mt-1 text-xs text-red-600">{e0.seller.gstin.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass()}>PAN</label>
          <input {...register(cp(index, "seller.pan"))} className={inputClass()} maxLength={10} />
        </div>
        <div>
          <label className={labelClass()}>State</label>
          <input {...register(cp(index, "seller.stateName"))} className={inputClass()} />
        </div>
        <div>
          <label className={labelClass()}>State code</label>
          <input {...register(cp(index, "seller.stateCode"))} className={inputClass()} maxLength={2} />
          {e0?.seller?.stateCode && (
            <p className="mt-1 text-xs text-red-600">{e0.seller.stateCode.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass()}>Phone</label>
          <input {...register(cp(index, "seller.phone"))} className={inputClass()} />
          {e0?.seller?.phone && (
            <p className="mt-1 text-xs text-red-600">{e0.seller.phone.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass()}>Email</label>
          <input type="email" {...register(cp(index, "seller.email"))} className={inputClass()} />
          {e0?.seller?.email && (
            <p className="mt-1 text-xs text-red-600">{e0.seller.email.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass()}>Mobile (optional)</label>
          <input {...register(cp(index, "seller.mobile"))} className={inputClass()} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Kind attention (optional)</label>
          <input {...register(cp(index, "seller.kindAttn"))} className={inputClass()} />
        </div>
      </div>

      <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-700">
        Bank (PDF)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass()}>Bank</label>
          <input {...register(cp(index, "seller.bankName"))} className={inputClass()} />
          {e0?.seller?.bankName && (
            <p className="mt-1 text-xs text-red-600">{e0.seller.bankName.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass()}>Account no.</label>
          <input {...register(cp(index, "seller.accountNo"))} className={inputClass()} />
          {e0?.seller?.accountNo && (
            <p className="mt-1 text-xs text-red-600">{e0.seller.accountNo.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass()}>IFSC</label>
          <input {...register(cp(index, "seller.ifsc"))} className={inputClass()} maxLength={11} />
          {e0?.seller?.ifsc && (
            <p className="mt-1 text-xs text-red-600">{e0.seller.ifsc.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass()}>Branch (optional)</label>
          <input {...register(cp(index, "seller.branch"))} className={inputClass()} />
        </div>
      </div>

      <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-700">
        PDF footer &amp; legal (optional)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass()}>Regd. office &amp; works</label>
          <textarea rows={2} {...register(cp(index, "seller.regdOffice"))} className={inputClass()} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Other office / branch line</label>
          <input {...register(cp(index, "seller.branchOfficeDetails"))} className={inputClass()} />
        </div>
        <div>
          <label className={labelClass()}>CIN</label>
          <input {...register(cp(index, "seller.cin"))} className={inputClass()} />
        </div>
        <div>
          <label className={labelClass()}>TAN</label>
          <input {...register(cp(index, "seller.tan"))} className={inputClass()} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Certifications (ISO line)</label>
          <input {...register(cp(index, "seller.certificationsLine"))} className={inputClass()} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Jurisdiction</label>
          <input {...register(cp(index, "seller.jurisdiction"))} className={inputClass()} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Declaration (optional)</label>
          <textarea rows={2} {...register(cp(index, "seller.declaration"))} className={inputClass()} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Certification line</label>
          <input {...register(cp(index, "seller.certificationLine"))} className={inputClass()} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Terms &amp; conditions (numbered)</label>
          <textarea rows={4} {...register(cp(index, "seller.termsAndConditions"))} className={inputClass()} />
        </div>
      </div>
    </FormSection>
  );
}
