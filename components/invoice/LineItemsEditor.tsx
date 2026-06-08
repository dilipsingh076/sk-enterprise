"use client";

import { Copy, Trash2 } from "lucide-react";
import { memo, useMemo } from "react";
import {
  Controller,
  get,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { visibleFieldError } from "@/lib/form/visibleFieldError";
import {
  Box,
  Button,
  Input,
  Option,
  Row,
  Select,
  Span,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  TextArea,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { cn } from "@/components/ui/cn";
import {
  lineGross,
  lineTaxAmount,
  lineTaxPercent,
  lineTaxableValue,
} from "@/lib/invoice/calculations";
import {
  coerceIndianGstRate,
  gstRateSelectValue,
  INDIAN_GST_RATE_OPTIONS,
} from "@/lib/invoice/indianGstRates";
import { getLineItemUnitOptions } from "@/lib/invoice/lineItemUnits";
import type { InvoiceFormInput, LineItem } from "@/lib/invoice/schema";
import type { SavedLineItem } from "@/lib/invoice/userProfile";

function formatAmt(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const numField = {
  valueAsNumber: true,
  setValueAs: (v: string | number) => {
    if (v === "" || v == null) return 0;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  },
} as const;

const cellInput =
  "mt-0 box-border w-full min-w-0 border border-zinc-300 bg-white px-1.5 py-1 text-xs text-zinc-900 " +
  "placeholder:text-zinc-400 rounded shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400";

const numInput = cn(
  cellInput,
  "text-right tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
);

const thBase =
  "border-b border-zinc-200 px-1.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-800";
const tdBase = "border-b border-zinc-100 px-1.5 py-1.5 align-middle";
const stickyTh = "sticky z-20 bg-zinc-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]";
const stickyTd = "sticky z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]";

const iconActionClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border p-0 shadow-sm transition-colors disabled:pointer-events-none disabled:opacity-40";

const amtCellClass =
  "whitespace-nowrap px-1.5 py-1.5 text-right align-middle text-[11px] font-medium tabular-nums text-zinc-950";

function CellError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text className="mt-0.5 truncate text-[9px] leading-tight text-red-600" title={message}>
      {message}
    </Text>
  );
}

type LineItemRowProps = {
  index: number;
  lineCount: number;
  invoiceGstPercent: number;
  taxMode: "IGST" | "CGST_SGST";
  remove: UseFieldArrayRemove;
  onDuplicate: (index: number) => void;
  onSaveLineToLibrary?: (line: LineItem) => void | Promise<void>;
};

const LineItemRow = memo(function LineItemRow({
  index,
  lineCount,
  invoiceGstPercent,
  taxMode,
  remove,
  onDuplicate,
  onSaveLineToLibrary,
}: LineItemRowProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InvoiceFormInput>();
  const { touchedFields, isSubmitted } = useFormState({ control });

  const line = useWatch({ control, name: `lineItems.${index}` });
  const amounts = useMemo(() => {
    const item = (line ?? {}) as LineItem;
    const gross = lineGross(item);
    const taxable = lineTaxableValue(item);
    const pct = lineTaxPercent(item, invoiceGstPercent);
    const tax = lineTaxAmount(taxable, taxMode, pct);
    const total = Math.round((taxable + tax) * 100) / 100;
    return { gross, tax, total };
  }, [line, taxMode, invoiceGstPercent]);

  const rowErrors = errors.lineItems?.[index];
  const rowTouched = isSubmitted || Boolean(get(touchedFields, `lineItems.${index}`));
  const cellError = (name: "description" | "hsn" | "quantity" | "unit" | "rate" | "taxPercent") =>
    rowTouched ? rowErrors?.[name]?.message : undefined;
  const zebra = index % 2 === 1;
  const rowBg = zebra ? "bg-zinc-50/90" : "bg-white";
  const stickyCellBg = zebra ? "bg-zinc-50/98" : "bg-white/98";

  return (
    <Tr className={rowBg}>
      <Td className={cn(tdBase, stickyTd, stickyCellBg, "left-0 text-center")}>
        <Span className="text-[10px] font-medium tabular-nums text-zinc-600">{index + 1}</Span>
      </Td>
      <Td className={cn(tdBase, stickyTd, stickyCellBg, "left-8")}>
        <TextArea
          rows={1}
          {...register(`lineItems.${index}.description`)}
          className={cn(cellInput, "min-h-[1.75rem] resize-y")}
          placeholder="Description"
        />
        <CellError message={cellError("description")} />
      </Td>
      <Td className={tdBase}>
        <Input
          inputMode="numeric"
          {...register(`lineItems.${index}.hsn`)}
          className={cn(cellInput, "text-center tracking-wide")}
          maxLength={12}
          placeholder="HSN"
        />
        <CellError message={cellError("hsn")} />
      </Td>
      <Td className={tdBase}>
        <Input
          type="number"
          step="any"
          min={0}
          {...register(`lineItems.${index}.quantity`, numField)}
          className={numInput}
        />
        <CellError message={cellError("quantity")} />
      </Td>
      <Td className={tdBase}>
        <Controller
          name={`lineItems.${index}.unit`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              variant="compact"
              searchable
              searchPlaceholder="Search units…"
              className="w-full min-w-[5.5rem]"
              aria-label={`Line ${index + 1} unit`}
            >
              {getLineItemUnitOptions(field.value ?? "").map((o) => (
                <Option key={o.value} value={o.value}>
                  {o.label}
                </Option>
              ))}
            </Select>
          )}
        />
        <CellError message={cellError("unit")} />
      </Td>
      <Td className={tdBase}>
        <Input
          type="number"
          step="any"
          min={0}
          {...register(`lineItems.${index}.rate`, numField)}
          className={numInput}
        />
        <CellError message={cellError("rate")} />
      </Td>
      <Td className={amtCellClass}>{formatAmt(amounts.gross)}</Td>
      <Td className={tdBase}>
        <Controller
          name={`lineItems.${index}.taxPercent`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              ref={field.ref}
              value={gstRateSelectValue(field.value, invoiceGstPercent)}
              onBlur={field.onBlur}
              variant="compact"
              portaled
              compactValueDisplay
              className="w-full min-w-[4.5rem]"
              aria-label={`Line ${index + 1} GST rate`}
              onChange={(e) => {
                field.onChange(coerceIndianGstRate(Number(e.target.value), invoiceGstPercent));
              }}
            >
              {INDIAN_GST_RATE_OPTIONS.map((o) => (
                <Option key={o.value} value={String(o.value)}>
                  {o.label}
                </Option>
              ))}
            </Select>
          )}
        />
        <CellError message={cellError("taxPercent")} />
      </Td>
      <Td className={amtCellClass}>{formatAmt(amounts.tax)}</Td>
      <Td className={cn(amtCellClass, "font-semibold")}>{formatAmt(amounts.total)}</Td>
      <Td className={cn(tdBase, "text-center")}>
        <Row className="items-center justify-center gap-0.5" gap="none">
          {onSaveLineToLibrary ? (
            <Button
              type="button"
              variant="outline"
              className={cn(iconActionClass, "border-zinc-300 text-zinc-800 hover:bg-zinc-50")}
              onClick={() => void onSaveLineToLibrary((line ?? {}) as LineItem)}
              aria-label={`Save line ${index + 1} to library`}
              title="Save to line library"
            >
              <Span className="text-[9px] font-bold">+</Span>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className={cn(iconActionClass, "border-zinc-300 text-zinc-800 hover:bg-zinc-50")}
            onClick={() => onDuplicate(index)}
            aria-label={`Copy line ${index + 1}`}
            title="Copy row"
          >
            <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="danger"
            className={cn(iconActionClass, "border-red-200 text-red-700 hover:bg-red-50")}
            onClick={() => remove(index)}
            disabled={lineCount <= 1}
            aria-label={`Delete line ${index + 1}`}
            title={lineCount <= 1 ? "At least one line is required" : "Delete row"}
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Button>
        </Row>
      </Td>
    </Tr>
  );
});

type LineItemsEditorProps = {
  savedLineItems?: SavedLineItem[];
  onSaveLineToLibrary?: (line: LineItem) => void | Promise<void>;
};

export function LineItemsEditor({ savedLineItems = [], onSaveLineToLibrary }: LineItemsEditorProps) {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<InvoiceFormInput>();
  const { touchedFields, isSubmitted } = useFormState({ control });
  const lineItemsError = visibleFieldError(errors, touchedFields, isSubmitted, "lineItems");
  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: "lineItems",
  });

  const gstPercentWatch = useWatch({ control, name: "gstPercent" });
  const taxModeWatch = useWatch({ control, name: "taxMode" });
  const invoiceGstPercent = Number(gstPercentWatch) || 0;
  const taxMode = taxModeWatch === "CGST_SGST" ? "CGST_SGST" : "IGST";

  const onDuplicate = (index: number) => {
    const row = getValues(`lineItems.${index}`);
    insert(index + 1, { ...row });
  };

  const appendTemplate = (tpl: SavedLineItem) => {
    append({
      description: tpl.description,
      hsn: tpl.hsn,
      quantity: 1,
      unit: tpl.unit,
      rate: tpl.rate,
      discountKind: "AMOUNT",
      discount: 0,
      taxPercent: coerceIndianGstRate(tpl.taxPercent ?? invoiceGstPercent),
    });
  };

  return (
    <Stack gap="sm">
      <Row className="flex-wrap justify-end" gap="sm">
        {savedLineItems.length > 0 ? (
          <Select
            value=""
            variant="compact"
            className="min-w-[10rem]"
            aria-label="Add line from saved library"
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              const tpl = savedLineItems.find((s) => s.id === id);
              if (tpl) appendTemplate(tpl);
              e.target.value = "";
            }}
          >
            <Option value="">From library…</Option>
            {savedLineItems.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.description.slice(0, 36)}
              </Option>
            ))}
          </Select>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({
              description: "",
              hsn: "",
              quantity: 1,
              unit: "Nos",
              rate: 0,
              discountKind: "AMOUNT",
              discount: 0,
              taxPercent: coerceIndianGstRate(invoiceGstPercent),
            })
          }
        >
          Add line
        </Button>
      </Row>
      {fields.length === 0 ? (
        <Text className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-center text-sm text-zinc-800">
          No line items yet. Use <Span className="font-semibold text-zinc-950">Add line</Span> to start.
        </Text>
      ) : (
        <Box className="overflow-x-auto overflow-y-visible rounded-lg border border-zinc-300 bg-white shadow-sm">
          <Table className="w-full min-w-[52rem] table-fixed border-collapse text-xs text-zinc-900">
            <colgroup>
              <col className="w-8" />
              <col className="w-[10.5rem]" />
              <col className="w-[4.25rem]" />
              <col className="w-[3.75rem]" />
              <col className="w-[7rem]" />
              <col className="w-[4.5rem]" />
              <col className="w-[6.25rem]" />
              <col className="w-[4.25rem]" />
              <col className="w-[5.5rem]" />
              <col className="w-[6.25rem]" />
              <col className="w-[4.25rem]" />
            </colgroup>
            <Thead>
              <Tr className="bg-zinc-100">
                <Th className={cn(thBase, stickyTh, "left-0 text-center")}>#</Th>
                <Th className={cn(thBase, stickyTh, "left-8 text-left")}>Description</Th>
                <Th className={cn(thBase, "text-center")}>HSN</Th>
                <Th className={cn(thBase, "text-right")}>Qty</Th>
                <Th className={cn(thBase, "text-center")}>Unit</Th>
                <Th className={cn(thBase, "text-right")}>Rate</Th>
                <Th className={cn(thBase, "text-right")} title="Qty × rate">
                  Amount
                </Th>
                <Th className={cn(thBase, "text-right")}>GST %</Th>
                <Th className={cn(thBase, "text-right")} title="Tax on qty × rate">
                  Tax
                </Th>
                <Th className={cn(thBase, "text-right")}>Total</Th>
                <Th className={cn(thBase, "text-center")}>
                  <Span className="sr-only">Actions</Span>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {fields.map((field, index) => (
                <LineItemRow
                  key={field.id}
                  index={index}
                  lineCount={fields.length}
                  invoiceGstPercent={invoiceGstPercent}
                  taxMode={taxMode}
                  remove={remove}
                  onDuplicate={onDuplicate}
                  onSaveLineToLibrary={onSaveLineToLibrary}
                />
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      {lineItemsError ? <Text className="text-sm text-red-600">{lineItemsError}</Text> : null}
    </Stack>
  );
}
