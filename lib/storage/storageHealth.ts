import { readBillsFile, readProfileBundle } from "@/lib/storage/serverJsonStore";

export type StorageHealth = {
  ok: boolean;
  backend: "blob" | "filesystem";
  blobConfigured: boolean;
  vercel: boolean;
  billsCount: number;
  profileOk: boolean;
  message: string;
};

export async function getStorageHealth(): Promise<StorageHealth> {
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const vercel = process.env.VERCEL === "1";
  const backend = blobConfigured ? "blob" : "filesystem";

  if (vercel && !blobConfigured) {
    return {
      ok: false,
      backend,
      blobConfigured,
      vercel,
      billsCount: 0,
      profileOk: false,
      message:
        "BLOB_READ_WRITE_TOKEN is not set. Bills and profile will not persist on Vercel.",
    };
  }

  try {
    const [billsFile, profile] = await Promise.all([readBillsFile(), readProfileBundle()]);
    return {
      ok: true,
      backend,
      blobConfigured,
      vercel,
      billsCount: billsFile.bills.length,
      profileOk: Boolean(profile.userProfile?.companies?.length),
      message: blobConfigured
        ? `Storage OK (Vercel Blob). ${billsFile.bills.length} saved bill(s).`
        : `Storage OK (local data/). ${billsFile.bills.length} saved bill(s).`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Storage check failed";
    return {
      ok: false,
      backend,
      blobConfigured,
      vercel,
      billsCount: 0,
      profileOk: false,
      message: msg,
    };
  }
}
