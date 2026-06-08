# sk-enterprise (e-bill)

GST-style invoice PDF app (Next.js). Run locally with `npm install` and `npm run dev`.

## Deploy (Vercel)

1. Create a [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store and add **`BLOB_READ_WRITE_TOKEN`** to the project environment variables, then **redeploy**.
2. Default is a **private** Blob store. If yours is **public**, also set **`BLOB_STORE_ACCESS=public`**.
3. Without the token, bills and profile data are not persisted on the server; the app logs a storage error and the storage banner will warn you.

## Local data

- JSON files under `data/` are used when Blob is not configured (typical local dev).
- After deploy, production uses Blob only; copy data with **Export backup** on the Bills page and **Import backup** on another environment if needed.

## Backup & recovery

- **Bills page → Export backup** downloads `bills-export.json` (profile + all bills).
- **Import backup** merges or replaces bills (see UI). Use this to restore after a bad deploy or to clone data to staging.
- Older saved bills are **migrated on read** (legacy field names, pincode default `000000`, removed freight/insurance fields). If Blob was already overwritten with an empty file before that fix, restore from Vercel Blob version history or a local export.

## Storage health

- `GET /api/storage/health` reports whether Blob/local storage is writable (used by the in-app storage status banner).

## Scripts

| Command        | Purpose              |
|----------------|----------------------|
| `npm run dev`  | Development server   |
| `npm run build`| Production build     |
| `npm test`     | Unit tests (Vitest)  |
| `npm run lint` | ESLint               |

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests, and build on push/PR to `main` or `master`.
