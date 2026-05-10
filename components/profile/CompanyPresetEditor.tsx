"use client";

import { ChevronRight, FileText, Landmark, ScrollText } from "lucide-react";
import { memo, useState } from "react";
import { useFormContext, type Path } from "react-hook-form";
import { FormSection } from "@/components/invoice/FormSection";
import {
  Details,
  Field,
  Grid,
  Input,
  Kbd,
  Label,
  Stack,
  Summary,
  Text,
  TextArea,
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
          <Field>
            <Label>Menu name</Label>
            <Input {...register(cp(index, "label"))} />
            {e0?.label ? <Text className="mt-1 text-xs text-red-600">{e0.label.message}</Text> : null}
          </Field>
          <Field>
            <Label>Invoice number prefix</Label>
            <Input {...register(cp(index, "invoiceNumberPrefix"))} placeholder="e.g. UK" maxLength={12} />
            <Text className="mt-1 text-[11px] text-zinc-500">
              New invoice numbers start as <Kbd className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px]">PREFIX-</Kbd> on the
              invoice page when this company is selected.
            </Text>
            {e0?.invoiceNumberPrefix ? (
              <Text className="mt-1 text-xs text-red-600">{String(e0.invoiceNumberPrefix.message)}</Text>
            ) : null}
          </Field>
          <Field>
            <Label>PDF header description</Label>
            <Input
              {...register(cp(index, "seller.pdfHeaderDescription"))}
              placeholder="e.g. Engineering, Infrastructure & Construction Works"
            />
            <Text className="mt-1 text-[11px] text-zinc-500">Leave blank to hide on the PDF.</Text>
          </Field>
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
          <Field className="sm:col-span-2">
            <Label>Legal name</Label>
            <Input {...register(cp(index, "seller.name"))} />
            {e0?.seller?.name ? (
              <Text className="mt-1 text-xs text-red-600">{e0.seller.name.message}</Text>
            ) : null}
          </Field>
          <Field className="sm:col-span-2">
            <Label>Address</Label>
            <TextArea rows={2} {...register(cp(index, "seller.address"))} />
            {e0?.seller?.address ? (
              <Text className="mt-1 text-xs text-red-600">{e0.seller.address.message}</Text>
            ) : null}
          </Field>
          <Field>
            <Label>GSTIN</Label>
            <Input {...register(cp(index, "seller.gstin"))} maxLength={15} />
            {e0?.seller?.gstin ? (
              <Text className="mt-1 text-xs text-red-600">{e0.seller.gstin.message}</Text>
            ) : null}
          </Field>
          <Field>
            <Label>PAN</Label>
            <Input {...register(cp(index, "seller.pan"))} maxLength={10} />
          </Field>
          <Field>
            <Label>State</Label>
            <Input {...register(cp(index, "seller.stateName"))} />
          </Field>
          <Field>
            <Label>State code</Label>
            <Input {...register(cp(index, "seller.stateCode"))} maxLength={2} />
            {e0?.seller?.stateCode ? (
              <Text className="mt-1 text-xs text-red-600">{e0.seller.stateCode.message}</Text>
            ) : null}
          </Field>
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
          <Field>
            <Label>Phone</Label>
            <Input {...register(cp(index, "seller.phone"))} />
            {e0?.seller?.phone ? (
              <Text className="mt-1 text-xs text-red-600">{e0.seller.phone.message}</Text>
            ) : null}
          </Field>
          <Field>
            <Label>Email</Label>
            <Input type="email" {...register(cp(index, "seller.email"))} />
            {e0?.seller?.email ? (
              <Text className="mt-1 text-xs text-red-600">{e0.seller.email.message}</Text>
            ) : null}
          </Field>
          <Field>
            <Label>Mobile (optional)</Label>
            <Input {...register(cp(index, "seller.mobile"))} />
          </Field>
          <Field className="sm:col-span-2">
            <Label>Kind attention (optional)</Label>
            <Input {...register(cp(index, "seller.kindAttn"))} />
          </Field>
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
          <Field>
            <Label>Bank</Label>
            <Input {...register(cp(index, "seller.bankName"))} />
            {e0?.seller?.bankName ? (
              <Text className="mt-1 text-xs text-red-600">{e0.seller.bankName.message}</Text>
            ) : null}
          </Field>
          <Field>
            <Label>Account no.</Label>
            <Input {...register(cp(index, "seller.accountNo"))} />
            {e0?.seller?.accountNo ? (
              <Text className="mt-1 text-xs text-red-600">{e0.seller.accountNo.message}</Text>
            ) : null}
          </Field>
          <Field>
            <Label>IFSC</Label>
            <Input {...register(cp(index, "seller.ifsc"))} maxLength={11} />
            {e0?.seller?.ifsc ? <Text className="mt-1 text-xs text-red-600">{e0.seller.ifsc.message}</Text> : null}
          </Field>
          <Field>
            <Label>Branch (optional)</Label>
            <Input {...register(cp(index, "seller.branch"))} />
          </Field>
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
          <Field className="sm:col-span-2">
            <Label>Regd. office &amp; works</Label>
            <TextArea rows={2} {...register(cp(index, "seller.regdOffice"))} />
          </Field>
          <Field className="sm:col-span-2">
            <Label>Other office / branch line</Label>
            <Input {...register(cp(index, "seller.branchOfficeDetails"))} />
          </Field>
          <Field>
            <Label>CIN</Label>
            <Input {...register(cp(index, "seller.cin"))} />
          </Field>
          <Field>
            <Label>TAN</Label>
            <Input {...register(cp(index, "seller.tan"))} />
          </Field>
          <Field className="sm:col-span-2">
            <Label>Certifications (ISO line)</Label>
            <Input {...register(cp(index, "seller.certificationsLine"))} />
          </Field>
          <Field className="sm:col-span-2">
            <Label>Jurisdiction</Label>
            <Input {...register(cp(index, "seller.jurisdiction"))} />
          </Field>
          <Field className="sm:col-span-2">
            <Label>Declaration (optional)</Label>
            <TextArea rows={2} {...register(cp(index, "seller.declaration"))} />
          </Field>
          <Field className="sm:col-span-2">
            <Label>Certification line</Label>
            <Input {...register(cp(index, "seller.certificationLine"))} />
          </Field>
          <Field className="sm:col-span-2">
            <Label>Terms &amp; conditions (numbered)</Label>
            <TextArea rows={3} {...register(cp(index, "seller.termsAndConditions"))} />
          </Field>
        </Grid>
      </Details>
    </FormSection>
  );
}

export const CompanyPresetEditor = memo(CompanyPresetEditorInner);
