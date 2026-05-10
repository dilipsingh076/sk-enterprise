import fs from "fs";
import path from "path";

let cachedDataUri: string | null | undefined;

const CANDIDATE_FILES = [
  "sk-enterprises-logo.png",
  "sk-enterprises-logo.jpg",
  "sk-enterprises-logo.jpeg",
];

function detectMime(buf: Buffer): "image/png" | "image/jpeg" | null {
  if (buf.length >= 8 &&
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) {
    return "image/png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

/** Base64 data URI for the bundled invoice header logo (server-side PDF only). */
export function getBrandingLogoDataUri(): string | null {
  if (cachedDataUri !== undefined) return cachedDataUri;
  try {
    const brandingDir = path.join(process.cwd(), "public", "branding");
    for (const name of CANDIDATE_FILES) {
      const filePath = path.join(brandingDir, name);
      if (!fs.existsSync(filePath)) continue;
      const buf = fs.readFileSync(filePath);
      const mime = detectMime(buf);
      if (!mime) continue;
      cachedDataUri = `data:${mime};base64,${buf.toString("base64")}`;
      return cachedDataUri;
    }
    cachedDataUri = null;
    return null;
  } catch {
    cachedDataUri = null;
    return null;
  }
}
