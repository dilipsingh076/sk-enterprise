/** Base-36 charset for GSTIN mod-36 checksum (GSTN / NIC algorithm). */
const GSTIN_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Structural pattern only (checksum not verified). */
export const GSTIN_FORMAT_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function charValue(c: string): number {
  return GSTIN_CHARSET.indexOf(c);
}

/**
 * Expected 15th character from the first 14 (mod-36, alternating factors 1 and 2).
 * @see GSTN GSTIN validation sample (developer portal)
 */
export function computeGstinCheckDigit(first14: string): string | null {
  const s = first14.trim().toUpperCase();
  if (s.length !== 14) return null;

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const cp = charValue(s[i]!);
    if (cp < 0) return null;
    const factor = i % 2 === 0 ? 1 : 2;
    const product = cp * factor;
    sum += Math.floor(product / 36) + (product % 36);
  }

  const checkCode = (36 - (sum % 36)) % 36;
  return GSTIN_CHARSET[checkCode] ?? null;
}

export function isValidGstinChecksum(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  if (g.length !== 15) return false;
  const expected = computeGstinCheckDigit(g.slice(0, 14));
  if (!expected) return false;
  return g[14] === expected;
}

export function gstinChecksumError(gstin: string): string | null {
  const g = gstin.trim().toUpperCase();
  if (g.length !== 15) return null;
  const expected = computeGstinCheckDigit(g.slice(0, 14));
  if (!expected) return "GSTIN contains invalid characters";
  if (g[14] === expected) return null;
  return `Invalid GSTIN checksum (expected "${expected}", got "${g[14]}")`;
}

export function isValidGstin(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  return g.length === 15 && GSTIN_FORMAT_REGEX.test(g) && isValidGstinChecksum(g);
}

/** First two digits of a GSTIN = GST state code (e.g. 05 Uttarakhand). */
export function stateCodeFromGstin(gstin: unknown): string | null {
  if (typeof gstin !== "string") return null;
  const g = gstin.trim().toUpperCase();
  if (g.length < 2 || !/^[0-9]{2}/.test(g)) return null;
  const n = Number(g.slice(0, 2));
  if (!Number.isFinite(n) || n < 1 || n > 37) return null;
  return g.slice(0, 2);
}
