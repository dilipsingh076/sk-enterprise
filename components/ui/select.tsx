"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Option } from "@/components/ui/option";
import { Box } from "@/components/ui/box";
import { cn } from "@/components/ui/cn";

export type SelectOptionItem = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

function isOptionElement(node: React.ReactNode): node is React.ReactElement<{ value?: string; disabled?: boolean; children?: React.ReactNode }> {
  if (!React.isValidElement(node)) return false;
  const t = node.type as { displayName?: string };
  return t === Option || t?.displayName === "SelectOption";
}

function parseOptions(children: React.ReactNode): SelectOptionItem[] {
  const out: SelectOptionItem[] = [];
  React.Children.forEach(children, (child) => {
    if (!isOptionElement(child)) return;
    const v = child.props.value;
    if (v == null) return;
    out.push({
      value: String(v),
      label: child.props.children,
      disabled: !!child.props.disabled,
    });
  });
  return out;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((r) => {
      if (!r) return;
      if (typeof r === "function") (r as (instance: T | null) => void)(node);
      else (r as React.MutableRefObject<T | null>).current = node;
    });
  };
}

function emitSelectChange(
  value: string,
  name: string | undefined,
  handler: React.ChangeEventHandler<HTMLSelectElement> | undefined,
) {
  if (!handler) return;
  handler({
    target: { value, name: name ?? "" } as HTMLSelectElement,
    currentTarget: { value, name: name ?? "" } as HTMLSelectElement,
  } as React.ChangeEvent<HTMLSelectElement>);
}

/** Full-width listbox trigger (default form fields). */
export const selectFieldClass =
  "mt-1 flex w-full min-h-[2.25rem] cursor-pointer items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-left text-sm text-zinc-900 " +
  "shadow-sm outline-none transition-[border-color,box-shadow] " +
  "focus-visible:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-400 " +
  "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60 " +
  "hover:border-zinc-400";

/** Compact listbox (e.g. line-item discount). */
export const selectCompactClass =
  "mt-0 flex w-full min-h-[2rem] cursor-pointer items-center justify-between gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-left text-sm text-zinc-900 " +
  "shadow-sm outline-none focus-visible:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-400 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const listboxPanelClass =
  "absolute left-0 right-0 top-full z-[200] mt-1 max-h-60 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg outline-none";

const listboxOptionClass =
  "flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 aria-selected:bg-zinc-100";

const listboxOptionCompactClass =
  "flex w-full cursor-pointer items-center justify-center px-2 py-1.5 text-center text-sm hover:bg-zinc-100 aria-selected:bg-zinc-100";

export type SelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "compact";
  invalid?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    id,
    name,
    value: valueProp,
    defaultValue,
    onChange,
    onBlur,
    disabled,
    required,
    className,
    variant = "default",
    invalid,
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
  },
  ref,
) {
  const items = React.useMemo(() => parseOptions(children), [children]);
  const autoId = React.useId();
  const listId = `${autoId}-list`;
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isControlled = valueProp !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState(() =>
    defaultValue != null ? String(defaultValue) : items[0]?.value ?? "",
  );

  const value = isControlled ? String(valueProp ?? "") : uncontrolled;

  React.useEffect(() => {
    if (!isControlled && defaultValue != null) setUncontrolled(String(defaultValue));
  }, [defaultValue, isControlled]);

  const selected = items.find((o) => o.value === value) ?? items[0];
  const selectedLabel = selected?.label ?? "—";

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next);
      emitSelectChange(next, name, onChange);
    },
    [isControlled, name, onChange],
  );

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const idx = Math.max(
      0,
      items.findIndex((o) => o.value === value),
    );
    setHighlight(idx);
  }, [open, items, value]);

  const onKeyDownTrigger = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onKeyDownList = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length === 0) return;
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length === 0) return;
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = items[highlight];
      if (opt && !opt.disabled) {
        setValue(opt.value);
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
  };

  const triggerClass = variant === "compact" ? selectCompactClass : selectFieldClass;
  const optClass = variant === "compact" ? listboxOptionCompactClass : listboxOptionClass;

  return (
    <Box ref={rootRef} className={cn("relative", className)}>
      <button
        ref={mergeRefs(ref, triggerRef)}
        type="button"
        role="combobox"
        id={id}
        name={name}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-autocomplete="none"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-required={required || undefined}
        className={cn(
          triggerClass,
          invalid && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-400/50",
        )}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDownTrigger}
        onBlur={onBlur}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-zinc-500 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={listboxPanelClass}
          onKeyDown={onKeyDownList}
        >
          {items.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              aria-disabled={opt.disabled || undefined}
              className={cn(optClass, opt.disabled && "cursor-not-allowed opacity-50")}
              onMouseDown={(e) => {
                if (opt.disabled) return;
                e.preventDefault();
                setValue(opt.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              {variant === "default" ? (
                <>
                  {opt.value === value ? (
                    <span className="w-4 shrink-0 text-zinc-600">✓</span>
                  ) : (
                    <span className="w-4 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">{opt.label}</span>
                </>
              ) : (
                <span className="min-w-0 flex-1">{opt.label}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </Box>
  );
});
