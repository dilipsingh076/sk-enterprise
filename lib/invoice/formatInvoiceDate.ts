const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_INDEX: Record<string, number> = Object.fromEntries(
  MONTH_FULL.flatMap((name, i) => [
    [name.toLowerCase(), i],
    [MONTH_ABBR[i].toLowerCase(), i],
  ]),
);

function calendarValid(y: number, m: number, d: number): boolean {
  const dt = new Date(y, m, d);
  return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
}

function toIso(y: number, m: number, d: number): string | null {
  if (!calendarValid(y, m, d)) return null;
  return `${String(y).padStart(4, "0")}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** `YYYY-MM-DD` → `31/May/2026` (dd / 3-letter month / yyyy). */
export function formatInvoiceDate(value: string | undefined | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [ys, ms, ds] = raw.split("-");
    const y = Number(ys);
    const m = Number(ms) - 1;
    const d = Number(ds);
    if (!calendarValid(y, m, d)) return raw;
    return `${String(d).padStart(2, "0")}/${MONTH_ABBR[m]}/${y}`;
  }
  return raw;
}

/** Parse ISO or `31/May/2026` (3-letter or full month) → `YYYY-MM-DD`. */
export function parseInvoiceDateToIso(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [ys, ms, ds] = raw.split("-");
    const y = Number(ys);
    const m = Number(ms) - 1;
    const d = Number(ds);
    return calendarValid(y, m, d) ? raw : null;
  }

  const named = raw.match(/^(\d{1,2})\/([A-Za-z]+)\/(\d{4})$/);
  if (named) {
    const d = Number(named[1]);
    const monthKey = named[2].toLowerCase();
    const y = Number(named[3]);
    const m = MONTH_INDEX[monthKey];
    if (m == null) return null;
    return toIso(y, m, d);
  }

  const numeric = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (numeric) {
    const d = Number(numeric[1]);
    const m = Number(numeric[2]) - 1;
    const y = Number(numeric[3]);
    return toIso(y, m, d);
  }

  const dashed = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashed) {
    const d = Number(dashed[1]);
    const m = Number(dashed[2]) - 1;
    const y = Number(dashed[3]);
    return toIso(y, m, d);
  }

  return null;
}

/** Canonical stored/display form: `31/May/2026`. Accepts ISO or legacy text. */
export function normalizeInvoiceDateStorage(value: string | undefined | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return formatInvoiceDate(raw);
  const iso = parseInvoiceDateToIso(raw);
  if (iso) return formatInvoiceDate(iso);
  return raw;
}

export function isValidInvoiceDate(value: string): boolean {
  return parseInvoiceDateToIso(value.trim()) != null;
}
