"use client";

import { ChevronRight, FileText, Landmark, ScrollText } from "lucide-react";
import { memo, useState } from "react";
import { useFormContext, type Path } from "react-hook-form";
import {
  Details,
  FormSection,
  Grid,
  Input,
  Stack,
  Summary,
  Text,
  TextAreaField,
  TextField,
} from "@/components/ui";
import type { UserProfile } from "@/lib/invoice/userProfile";

function cp(index: 0 | 1, key: string): Path<UserProfile> {
  return `companies.${index}.${key}` as Path<UserProfile>;
}

const detailsShell =
  "group mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/50 open:bg-white open:shadow-sm";

const detailsSummaryClass =
  "flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-800 " +
  "[&::-webkit-details-marker]:hidden hover:bg-zinc-100/80 open:rounded-b-none open:border-b open:border-zinc-100 open:bg-white";

function CompanyPresetEditorInner({
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

  const [openInvoice, setOpenInvoice] = useState(true);
  const [openLegal, setOpenLegal] = useState(true);
  const [openContact, setOpenContact] = useState(true);
  const [openBank, setOpenBank] = useState(false);
  const [openFooter, setOpenFooter] = useState(false);

  return (
    <FormSection
      id={`profile-company-${index}`}
      title={title}
      dense
      leading={<FileText className="text-zinc-600" aria-hidden />}
    >
      <Input type="hidden" {...register(cp(index, "id"))} />

      <Details
        className={`${detailsShell} mb-2`}
        open={openInvoice}
        onToggle={(e) => setOpenInvoice((e.target as HTMLDetailsElement).open)}
      >
        <Summary className={detailsSummaryClass}>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90"
            aria-hidden
          />
          Invoice menu &amp; PDF header
        </Summary>
        <Stack gap="sm" className="border-t border-zinc-100 bg-white px-2 py-3">
          <Text className="text-[11px] leading-snug text-zinc-600">
            Shown on the invoice page and under your legal name on the PDF.
          </Text>
          <TextField
            label="Menu name"
            required
            error={e0?.label?.message}
            {...register(cp(index, "label"))}
          />
          <TextField
            label="Invoice number prefix"
            placeholder="e.g. UK"
            maxLength={12}
            error={e0?.invoiceNumberPrefix?.message}
            {...register(cp(index, "invoiceNumberPrefix"))}
          />
          <TextField
            label="PDF header description"
            optional
            placeholder="e.g. Engineering, Infrastructure & Construction Works"
            {...register(cp(index, "seller.pdfHeaderDescription"))}
          />
        </Stack>
      </Details>

      <Details
        className={`${detailsShell} mb-2`}
        open={openLegal}
        onToggle={(e) => setOpenLegal((e.target as HTMLDetailsElement).open)}
      >
        <Summary className={detailsSummaryClass}>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90"
            aria-hidden
          />
          Legal name, GSTIN &amp; address
        </Summary>
        <Grid columns="grid-cols-1 sm:grid-cols-2" gap="sm" className="border-t border-zinc-100 bg-white px-2 py-3">
          <TextField
            label="Legal name"
            required
            className="sm:col-span-2"
            error={e0?.seller?.name?.message}
            {...register(cp(index, "seller.name"))}
          />
          <TextAreaField
            label="Address"
            required
            className="sm:col-span-2"
            rows={2}
            error={e0?.seller?.address?.message}
            {...register(cp(index, "seller.address"))}
          />
          <TextField
            label="Pincode"
            required
            error={e0?.seller?.pincode?.message}
            maxLength={6}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="e.g. 248013"
            {...register(cp(index, "seller.pincode"))}
          />
          <TextField label="City" optional autoComplete="address-level2" {...register(cp(index, "seller.city"))} />
          <TextField
            label="GSTIN"
            required
            error={e0?.seller?.gstin?.message}
            maxLength={15}
            {...register(cp(index, "seller.gstin"))}
          />
          <TextField label="PAN" optional maxLength={10} {...register(cp(index, "seller.pan"))} />
          <TextField label="State" required {...register(cp(index, "seller.stateName"))} />
          <TextField
            label="State code"
            required
            maxLength={2}
            error={e0?.seller?.stateCode?.message}
            {...register(cp(index, "seller.stateCode"))}
          />
        </Grid>
      </Details>

      <Details
        className={`${detailsShell} mb-2`}
        open={openContact}
        onToggle={(e) => setOpenContact((e.target as HTMLDetailsElement).open)}
      >
        <Summary className={detailsSummaryClass}>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90"
            aria-hidden
          />
          Contact
        </Summary>
        <Grid columns="grid-cols-1 sm:grid-cols-2" gap="sm" className="border-t border-zinc-100 bg-white px-2 py-3">
          <TextField label="Phone" required error={e0?.seller?.phone?.message} {...register(cp(index, "seller.phone"))} />
          <TextField
            label="Email"
            required
            type="email"
            error={e0?.seller?.email?.message}
            {...register(cp(index, "seller.email"))}
          />
          <TextField label="Mobile" optional {...register(cp(index, "seller.mobile"))} />
          <TextField label="Kind attention" optional className="sm:col-span-2" {...register(cp(index, "seller.kindAttn"))} />
        </Grid>
      </Details>

      <Details
        className={detailsShell}
        open={openBank}
        onToggle={(e) => setOpenBank((e.target as HTMLDetailsElement).open)}
      >
        <Summary className={detailsSummaryClass}>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90"
            aria-hidden
          />
          <Landmark className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
          Bank on PDF
        </Summary>
        <Grid columns="grid-cols-1 sm:grid-cols-2" gap="sm" className="border-t border-zinc-100 bg-white px-2 py-3">
          <TextField label="Bank" required error={e0?.seller?.bankName?.message} {...register(cp(index, "seller.bankName"))} />
          <TextField
            label="Account no."
            required
            error={e0?.seller?.accountNo?.message}
            {...register(cp(index, "seller.accountNo"))}
          />
          <TextField
            label="IFSC"
            required
            maxLength={11}
            error={e0?.seller?.ifsc?.message}
            {...register(cp(index, "seller.ifsc"))}
          />
          <TextField label="Branch" optional {...register(cp(index, "seller.branch"))} />
        </Grid>
      </Details>

      <Details
        className={`${detailsShell} mt-2`}
        open={openFooter}
        onToggle={(e) => setOpenFooter((e.target as HTMLDetailsElement).open)}
      >
        <Summary className={detailsSummaryClass}>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90"
            aria-hidden
          />
          <ScrollText className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
          PDF footer &amp; legal (optional)
        </Summary>
        <Grid columns="grid-cols-1 sm:grid-cols-2" gap="sm" className="border-t border-zinc-100 bg-white px-2 py-3">
          <TextAreaField
            label="Regd. office & works"
            optional
            className="sm:col-span-2"
            rows={2}
            {...register(cp(index, "seller.regdOffice"))}
          />
          <TextField
            label="Other office / branch line"
            optional
            className="sm:col-span-2"
            {...register(cp(index, "seller.branchOfficeDetails"))}
          />
          <TextField label="CIN" optional {...register(cp(index, "seller.cin"))} />
          <TextField label="TAN" optional {...register(cp(index, "seller.tan"))} />
          <TextField
            label="Certifications (ISO line)"
            optional
            className="sm:col-span-2"
            {...register(cp(index, "seller.certificationsLine"))}
          />
          <TextField label="Jurisdiction" optional className="sm:col-span-2" {...register(cp(index, "seller.jurisdiction"))} />
          <TextAreaField
            label="Declaration"
            optional
            className="sm:col-span-2"
            rows={2}
            {...register(cp(index, "seller.declaration"))}
          />
          <TextField
            label="Certification line"
            optional
            className="sm:col-span-2"
            {...register(cp(index, "seller.certificationLine"))}
          />
          <TextAreaField
            label="Terms & conditions (numbered)"
            optional
            className="sm:col-span-2"
            rows={3}
            {...register(cp(index, "seller.termsAndConditions"))}
          />
        </Grid>
      </Details>
    </FormSection>
  );
}

export const CompanyPresetEditor = memo(CompanyPresetEditorInner);
