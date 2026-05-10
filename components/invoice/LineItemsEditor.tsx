"use client";

import { Copy, Trash2 } from "lucide-react";
import { memo, useMemo } from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
  type UseFieldArrayRemove,
} from "react-hook-form";
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
import { getLineItemUnitOptions } from "@/lib/invoice/lineItemUnits";
import type { InvoiceFormInput } from "@/lib/invoice/schema";

function previewLineTaxable(line: {
  quantity?: unknown;
  rate?: unknown;
  discountKind?: unknown;
  discount?: unknown;
}): number {
  const qty = Number(line?.quantity) || 0;
  const rate = Number(line?.rate) || 0;
  const kind = line?.discountKind === "PERCENT" ? "PERCENT" : "AMOUNT";
  const disc = Number(line?.discount) || 0;
  const gross = Math.round(qty * rate * 100) / 100;
  const dr =
    kind === "PERCENT"
      ? Math.min(gross, Math.round((gross * (disc / 100)) * 100) / 100)
      : Math.min(gross, Math.round(disc * 100) / 100);
  return Math.max(0, Math.round((gross - dr) * 100) / 100);
}

const cellControlClass =
  "mt-0 border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 " +
  "rounded-md border shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400";

const stickyTh = "sticky z-20 border-r border-zinc-200 bg-zinc-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]";
const stickyTdOdd = "sticky z-10 border-r border-zinc-100 bg-white/95 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]";
const stickyTdEven = "sticky z-10 border-r border-zinc-100 bg-zinc-50/95 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]";

const iconActionClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border p-0 shadow-sm transition-colors disabled:pointer-events-none disabled:opacity-40";

type LineItemRowProps = {
  index: number;
  lineCount: number;
  remove: UseFieldArrayRemove;
  onDuplicate: (index: number) => void;
};

const LineItemRow = memo(function LineItemRow({ index, lineCount, remove, onDuplicate }: LineItemRowProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InvoiceFormInput>();

  const line = useWatch({ control, name: `lineItems.${index}` });
  const amt = useMemo(() => previewLineTaxable(line ?? {}), [line]);
  const isPercent = line?.discountKind === "PERCENT";
  const rowErrors = errors.lineItems?.[index];
  const zebra = index % 2 === 1;
  const stickyBg = zebra ? stickyTdEven : stickyTdOdd;

  return (
    <Tr className={zebra ? "bg-zinc-50/80" : ""}>
      <Td
        className={cn(
          "px-2 py-1.5 text-center text-xs font-medium tabular-nums text-zinc-700",
          stickyBg,
          "left-0 min-w-[2.5rem]",
        )}
      >
        {index + 1}
      </Td>
      <Td className={cn("px-2 py-1.5", stickyBg, "left-[2.5rem] min-w-[10rem]")}>
        <TextArea
          rows={2}
          {...register(`lineItems.${index}.description`)}
          className={cn(cellControlClass, "w-full min-w-[120px] resize-y")}
          placeholder="Item or service"
        />
        {rowErrors?.description ? (
          <Text className="mt-0.5 text-xs text-red-600">{rowErrors.description.message}</Text>
        ) : null}
      </Td>
      <Td className="px-2 py-1.5">
        <Input
          inputMode="numeric"
          {...register(`lineItems.${index}.hsn`)}
          className={cn(cellControlClass, "w-24 font-medium tracking-wide")}
          maxLength={12}
          placeholder="4–12 digits"
        />
        {rowErrors?.hsn ? <Text className="mt-0.5 text-xs text-red-600">{rowErrors.hsn.message}</Text> : null}
      </Td>
      <Td className="px-2 py-1.5">
        <Input
          type="number"
          step="any"
          {...register(`lineItems.${index}.quantity`)}
          className={cn(cellControlClass, "w-full min-w-[3.5rem] text-right tabular-nums")}
        />
        {rowErrors?.quantity ? (
          <Text className="mt-0.5 text-xs text-red-600">{rowErrors.quantity.message}</Text>
        ) : null}
      </Td>
      <Td className="min-w-[8rem] px-2 py-1.5">
        <Controller
          name={`lineItems.${index}.unit`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              variant="compact"
              className="w-full min-w-[7.5rem]"
              aria-label={`Line ${index + 1} unit of measure`}
            >
              {getLineItemUnitOptions(field.value ?? "").map((o) => (
                <Option key={o.value} value={o.value}>
                  {o.label}
                </Option>
              ))}
            </Select>
          )}
        />
        {rowErrors?.unit ? <Text className="mt-0.5 text-xs text-red-600">{rowErrors.unit.message}</Text> : null}
      </Td>
      <Td className="px-2 py-1.5">
        <Input
          type="number"
          step="any"
          min={0}
          {...register(`lineItems.${index}.rate`)}
          className={cn(cellControlClass, "w-full min-w-[4rem] text-right tabular-nums")}
        />
        {rowErrors?.rate ? <Text className="mt-0.5 text-xs text-red-600">{rowErrors.rate.message}</Text> : null}
      </Td>
      <Td className="px-2 py-1.5">
        <Box className="flex min-w-[8.5rem] flex-col gap-1 sm:flex-row sm:items-start">
          <Controller
            name={`lineItems.${index}.discountKind`}
            control={control}
            render={({ field: k }) => (
              <Select
                {...k}
                variant="compact"
                className="w-full shrink-0 font-medium sm:w-[3.75rem]"
                aria-label={`Line ${index + 1} discount type`}
              >
                <Option value="AMOUNT">₹</Option>
                <Option value="PERCENT">%</Option>
              </Select>
            )}
          />
          <Input
            type="number"
            step="0.01"
            min={0}
            max={isPercent ? 100 : undefined}
            title={isPercent ? "Discount percent (0–100)" : "Discount amount in ₹"}
            {...register(`lineItems.${index}.discount`)}
            className={cn(cellControlClass, "w-full text-right tabular-nums sm:min-w-[3.5rem]")}
          />
        </Box>
        {rowErrors?.discount ? (
          <Text className="mt-0.5 text-xs text-red-600">{rowErrors.discount.message}</Text>
        ) : null}
        {rowErrors?.discountKind ? (
          <Text className="mt-0.5 text-xs text-red-600">{rowErrors.discountKind.message}</Text>
        ) : null}
      </Td>
      <Td className="px-2 py-1.5 text-right text-sm font-medium tabular-nums text-zinc-950">
        {amt.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Td>
      <Td className="w-[5.5rem] whitespace-nowrap px-2 py-1.5">
        <Row className="items-center justify-end gap-1" gap="none">
          <Button
            type="button"
            variant="outline"
            className={cn(iconActionClass, "border-zinc-300 text-zinc-800 hover:bg-zinc-50")}
            onClick={() => onDuplicate(index)}
            aria-label={`Copy line ${index + 1}`}
            title="Copy row"
          >
            <Copy className="h-4 w-4 shrink-0" aria-hidden />
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
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
        </Row>
      </Td>
    </Tr>
  );
});

export function LineItemsEditor() {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<InvoiceFormInput>();
  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: "lineItems",
  });

  const onDuplicate = (index: number) => {
    const row = getValues(`lineItems.${index}`);
    insert(index + 1, { ...row });
  };

  return (
    <Stack gap="sm">
      <Box className="flex justify-end">
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
            })
          }
        >
          Add line
        </Button>
      </Box>
      {fields.length === 0 ? (
        <Text className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-center text-sm text-zinc-800">
          No line items yet. Use <Span className="font-semibold text-zinc-950">Add line</Span> to start.
        </Text>
      ) : (
        <Box className="overflow-x-auto rounded-lg border border-zinc-300 bg-white shadow-sm">
          <Table className="min-w-[680px] w-full divide-y divide-zinc-200 text-sm text-zinc-900">
            <Thead className="bg-zinc-100 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-900">
              <Tr>
                <Th className={cn("px-2 py-2.5", stickyTh, "left-0 w-10 min-w-[2.5rem]")}>#</Th>
                <Th className={cn("px-2 py-2.5", stickyTh, "left-[2.5rem] min-w-[10rem]")}>Description</Th>
                <Th className="px-2 py-2.5">HSN</Th>
                <Th className="px-2 py-2.5 text-right">Qty</Th>
                <Th className="px-2 py-2.5">Unit</Th>
                <Th className="px-2 py-2.5 text-right">Rate</Th>
                <Th className="px-2 py-2.5">Disc.</Th>
                <Th className="px-2 py-2.5 text-right">Taxable</Th>
                <Th className="w-[5.5rem] px-2 py-2.5 text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody className="divide-y divide-zinc-200 bg-white">
              {fields.map((field, index) => (
                <LineItemRow
                  key={field.id}
                  index={index}
                  lineCount={fields.length}
                  remove={remove}
                  onDuplicate={onDuplicate}
                />
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      {errors.lineItems && typeof errors.lineItems.message === "string" ? (
        <Text className="text-sm text-red-600">{errors.lineItems.message}</Text>
      ) : null}
    </Stack>
  );
}
