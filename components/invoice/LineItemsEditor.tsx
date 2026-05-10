"use client";

import { useMemo } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { InvoiceFormInput } from "@/lib/invoice/schema";

function lineTaxable(qty: number, rate: number, discount: number | undefined) {
  const d = discount ?? 0;
  return Math.max(0, Math.round((qty * rate - d) * 100) / 100);
}

/** Inputs: forced dark text (browser defaults can look grey on some themes). */
const cellControlClass =
  "border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 " +
  "rounded-md border shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400";

export function LineItemsEditor() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InvoiceFormInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const lines = useWatch({ control, name: "lineItems" });

  const amounts = useMemo(() => {
    if (!lines?.length) return [];
    return lines.map((line) => {
      const qty = Number(line?.quantity) || 0;
      const rate = Number(line?.rate) || 0;
      const disc = Number(line?.discount) || 0;
      return lineTaxable(qty, rate, disc);
    });
  }, [lines]);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            append({
              description: "",
              hsn: "",
              quantity: 1,
              unit: "Nos",
              rate: 0,
              discount: 0,
            })
          }
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          Add line
        </button>
      </div>
      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-800">
          No line items yet. Use <span className="font-semibold text-zinc-950">Add line</span> to start.
        </p>
      ) : (
      <div className="overflow-x-auto rounded-lg border border-zinc-300 bg-white shadow-sm">
        <table className="min-w-[640px] w-full divide-y divide-zinc-200 text-sm text-zinc-900">
          <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-900">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Description</th>
              <th className="px-3 py-2.5">HSN</th>
              <th className="px-3 py-2.5 text-right">Qty</th>
              <th className="px-3 py-2.5">Unit</th>
              <th className="px-3 py-2.5 text-right">Rate</th>
              <th className="px-3 py-2.5 text-right">Disc.</th>
              <th className="px-3 py-2.5 text-right">Amt</th>
              <th className="w-10 px-1 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {fields.map((field, index) => (
              <tr key={field.id} className={index % 2 === 1 ? "bg-zinc-50/80" : ""}>
                <td className="px-3 py-2 text-center text-xs font-medium tabular-nums text-zinc-700">
                  {index + 1}
                </td>
                <td className="px-3 py-2">
                  <textarea
                    rows={2}
                    {...register(`lineItems.${index}.description`)}
                    className={`${cellControlClass} w-full min-w-[140px] resize-y`}
                  />
                  {errors.lineItems?.[index]?.description && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.lineItems[index]?.description?.message}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    {...register(`lineItems.${index}.hsn`)}
                    className={`${cellControlClass} w-24 font-medium tracking-wide`}
                    maxLength={12}
                  />
                  {errors.lineItems?.[index]?.hsn && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.lineItems[index]?.hsn?.message}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="any"
                    {...register(`lineItems.${index}.quantity`)}
                    className={`${cellControlClass} w-full min-w-[4rem] text-right tabular-nums`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    {...register(`lineItems.${index}.unit`)}
                    className={`${cellControlClass} w-20`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="any"
                    {...register(`lineItems.${index}.rate`)}
                    className={`${cellControlClass} w-full min-w-[4.5rem] text-right tabular-nums`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="any"
                    {...register(`lineItems.${index}.discount`)}
                    className={`${cellControlClass} w-20 text-right tabular-nums`}
                  />
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-zinc-950">
                  {amounts[index] != null
                    ? amounts[index].toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </td>
                <td className="px-1 py-1.5">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded p-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {errors.lineItems && typeof errors.lineItems.message === "string" && (
        <p className="text-sm text-red-600">{errors.lineItems.message}</p>
      )}
    </div>
  );
}
