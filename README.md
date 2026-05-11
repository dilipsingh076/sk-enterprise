# sk-enterprise (e-bill)

GST-style invoice PDF app (Next.js). Run locally with `npm install` and `npm run dev`.

Deploy on [Vercel](https://vercel.com): set **`BLOB_READ_WRITE_TOKEN`** (Vercel Blob **read/write** token) on **Production** (and Preview if you use it), then **redeploy**. Without it, saves on Vercel fail because the server filesystem is not persistent.
