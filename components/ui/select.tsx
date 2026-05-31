"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
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

const listboxPanelInlineClass = cn(
  "absolute left-0 right-0 top-full z-[200] mt-1 max-h-60 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg outline-none",
);

const listboxPanelFloatedClass = cn(
  "z-[9999] rounded-lg border border-zinc-200 bg-white py-1 shadow-xl outline-none",
);

const listboxPanelFloatedPortaledClass = cn(
  listboxPanelFloatedClass,
  "min-w-[17rem] w-max max-w-[min(22rem,calc(100vw-1.5rem))] overflow-auto",
);

const listboxPanelFloatedSearchableClass = cn(
  listboxPanelFloatedClass,
  "flex min-w-[16rem] w-max max-w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden",
);

const listboxOptionClass =
  "flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 aria-selected:bg-zinc-100";

const listboxOptionCompactClass =
  "flex w-full cursor-pointer items-center px-2 py-1.5 text-left text-xs text-zinc-900 hover:bg-zinc-100 aria-selected:bg-zinc-100";

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
  searchable?: boolean;
  searchPlaceholder?: string;
  listClassName?: string;
  /** Render listbox in a fixed portal (avoids table overflow / z-index clipping). */
  portaled?: boolean;
  /** Compact trigger shows value only (e.g. `18%`) while list shows full labels. */
  compactValueDisplay?: boolean;
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
    searchable = false,
    searchPlaceholder = "Search…",
    listClassName,
    portaled = false,
    compactValueDisplay = false,
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
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [panelRect, setPanelRect] = React.useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const useFloatingPanel = searchable || portaled;

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
  const triggerLabel =
    variant === "compact" && compactValueDisplay && selected
      ? `${selected.value}%`
      : searchable && variant === "compact"
        ? (selected?.value ?? selectedLabel)
        : selectedLabel;

  const filteredItems = React.useMemo(() => {
    if (!searchable) return items;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((o) => {
      const val = o.value.toLowerCase();
      const lab = String(o.label ?? "").toLowerCase();
      return val.includes(q) || lab.includes(q);
    });
  }, [items, query, searchable]);

  const listItems = searchable ? filteredItems : items;

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next);
      emitSelectChange(next, name, onChange);
    },
    [isControlled, name, onChange],
  );

  const updatePanelRect = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const gap = 4;
    const minWidth = searchable ? 256 : portaled ? 272 : r.width;
    const width = Math.min(Math.max(r.width, minWidth), window.innerWidth - 16);
    let left = r.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - 8 - width);
    }
    const preferredMax = searchable ? 288 : portaled ? 320 : 240;
    const spaceBelow = window.innerHeight - r.bottom - gap;
    const spaceAbove = r.top - gap;
    const openBelow = spaceBelow >= 120 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(
      preferredMax,
      Math.max(120, (openBelow ? spaceBelow : spaceAbove) - 8),
    );
    const top = openBelow ? r.bottom + gap : Math.max(8, r.top - gap - maxHeight);
    setPanelRect({ top, left, width, maxHeight });
  }, [searchable, portaled]);

  React.useEffect(() => {
    if (!open || !useFloatingPanel) {
      setPanelRect(null);
      return;
    }
    updatePanelRect();
    window.addEventListener("resize", updatePanelRect);
    window.addEventListener("scroll", updatePanelRect, true);
    return () => {
      window.removeEventListener("resize", updatePanelRect);
      window.removeEventListener("scroll", updatePanelRect, true);
    };
  }, [open, useFloatingPanel, updatePanelRect]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    if (searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    const idx = Math.max(
      0,
      listItems.findIndex((o) => o.value === value),
    );
    setHighlight(idx >= 0 ? idx : 0);
  }, [open, listItems, value, searchable]);

  React.useEffect(() => {
    if (highlight >= listItems.length) {
      setHighlight(Math.max(0, listItems.length - 1));
    }
  }, [highlight, listItems.length]);

  const onKeyDownTrigger = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const moveHighlight = React.useCallback((delta: number) => {
    if (listItems.length === 0) return;
    setHighlight((h) => Math.min(Math.max(h + delta, 0), listItems.length - 1));
  }, [listItems.length]);

  const chooseHighlighted = React.useCallback(() => {
    const opt = listItems[highlight];
    if (opt && !opt.disabled) {
      setValue(opt.value);
      setOpen(false);
      triggerRef.current?.focus();
    }
  }, [highlight, listItems, setValue]);

  const onKeyDownList = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      chooseHighlighted();
    }
  };

  const onKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      chooseHighlighted();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const triggerClass = variant === "compact" ? selectCompactClass : selectFieldClass;
  const optClass =
    portaled && !searchable
      ? listboxOptionClass
      : variant === "compact" || searchable
        ? listboxOptionCompactClass
        : listboxOptionClass;
  const showCheckmarks = variant === "default" && !searchable;

  const listboxPanel = (
    <Box
      ref={panelRef}
      className={cn(
        useFloatingPanel
          ? searchable
            ? listboxPanelFloatedSearchableClass
            : portaled
              ? listboxPanelFloatedPortaledClass
              : listboxPanelFloatedClass
          : searchable
            ? cn(
                "absolute left-0 top-full z-[200] mt-1 flex max-h-72 min-w-[16rem] w-max max-w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg outline-none",
              )
            : listboxPanelInlineClass,
        listClassName,
      )}
      style={
        useFloatingPanel && panelRect
          ? {
              position: "fixed",
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              maxHeight: panelRect.maxHeight,
            }
          : undefined
      }
    >
      {searchable ? (
        <Box className="shrink-0 border-b border-zinc-200 bg-white p-1.5">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={onKeyDownSearch}
            placeholder={searchPlaceholder}
            aria-label={ariaLabel ? `${ariaLabel} search` : "Search options"}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            onMouseDown={(e) => e.stopPropagation()}
          />
        </Box>
      ) : null}
      <ul
        id={listId}
        role="listbox"
        tabIndex={-1}
        className={cn(
          "overflow-auto outline-none",
          searchable ? "min-h-0 flex-1 py-1" : "max-h-60",
        )}
        onKeyDown={onKeyDownList}
      >
        {listItems.length === 0 ? (
          <li className="px-2.5 py-2 text-xs text-zinc-500">No matches</li>
        ) : (
          listItems.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              aria-disabled={opt.disabled || undefined}
              className={cn(
                optClass,
                i === highlight && "bg-zinc-100",
                opt.disabled && "cursor-not-allowed opacity-50",
              )}
              onMouseDown={(e) => {
                if (opt.disabled) return;
                e.preventDefault();
                setValue(opt.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              {showCheckmarks ? (
                <>
                  {opt.value === value ? (
                    <span className="w-4 shrink-0 text-zinc-600">✓</span>
                  ) : (
                    <span className="w-4 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">{opt.label}</span>
                </>
              ) : (
                <span className="min-w-0 flex-1 text-left leading-snug">{opt.label}</span>
              )}
            </li>
          ))
        )}
      </ul>
    </Box>
  );

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
        aria-autocomplete={searchable ? "list" : "none"}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-required={required || undefined}
        className={cn(
          triggerClass,
          invalid && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-400/50",
        )}
        onClick={() => {
          if (disabled) return;
          if (!open) {
            if (useFloatingPanel) updatePanelRect();
            setOpen(true);
          } else {
            setOpen(false);
          }
        }}
        onKeyDown={onKeyDownTrigger}
        onBlur={onBlur}
      >
        <span className="min-w-0 flex-1 truncate text-left" title={String(selectedLabel)}>
          {triggerLabel}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-zinc-500 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && useFloatingPanel && panelRect && typeof document !== "undefined"
        ? createPortal(listboxPanel, document.body)
        : null}
      {open && !useFloatingPanel ? listboxPanel : null}
    </Box>
  );
});
