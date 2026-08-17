<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single Next.js 16 app (Turbopack); scripts live in `package.json`. Dependencies are refreshed automatically by the startup update script (`npm ci`).

- Run: `npm run dev` serves on port 3000. No env vars are required — without `DATABASE_URL` the app falls back to bundled seed articles (`src/lib/seed.ts`), so the home page, article detail, and `/library` all work out of the box.
- Lint: `npm run lint`. Build: `npm run build`. Both pass on a clean checkout.
- There is no automated test suite (no test runner or test files); validate changes via lint, build, and manual browser testing.
- Optional integrations (only needed to exercise those specific paths): `DATABASE_URL` (Neon Postgres) enables persistence in `src/lib/store.ts`; `INGEST_SECRET` gates the `POST /api/ingest` write path (see `src/lib/auth.ts`). Copy `.env.example` to `.env.local` if you set them.
- Save / read / watch-keyword features are browser `localStorage` only (no backend), so they persist per-browser and do not sync across devices.
- When ingesting without a DB, articles are written to a gitignored `/data/articles.json` file.
