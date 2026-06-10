import fs from "fs";
import path from "path";

let cachedDataUri: string | null | undefined;

const SIGNATURE_FILE = "sk-enterprises-signature.png";

function detectMime(buf: Buffer): "image/png" | "image/jpeg" | null {
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

const SK_ENTERPRISES_GSTIN = "05ACSPC4640C1ZZ";

/** SK Enterprises (UK) issuer — bundled proprietor signature applies only to this GSTIN. */
export function usesBrandingSignature(gstin: string): boolean {
  return gstin.trim().toUpperCase() === SK_ENTERPRISES_GSTIN;
}

/** Base64 data URI for the bundled SK Enterprises signature (server-side PDF only). */
export function getBrandingSignatureDataUri(): string | null {
  if (cachedDataUri !== undefined) return cachedDataUri;
  try {
    const filePath = path.join(process.cwd(), "public", "branding", SIGNATURE_FILE);
    if (!fs.existsSync(filePath)) {
      cachedDataUri = null;
      return null;
    }
    const buf = fs.readFileSync(filePath);
    const mime = detectMime(buf);
    if (!mime) {
      cachedDataUri = null;
      return null;
    }
    cachedDataUri = `data:${mime};base64,${buf.toString("base64")}`;
    return cachedDataUri;
  } catch {
    cachedDataUri = null;
    return null;
  }
}
