# Intake PRD

Dynamic website intake and PRD generation workspace built on Next.js App Router.

## What is in this repo

- Schema-driven public intake flow at `/intake/[token]`
- Admin review surface at `/admin/intake`
- Mocked generation and export routes for PRD and readiness artifacts
- Shared intake schema, logic engine, readiness scoring, and in-memory demo store
- Supabase-based database and authentication integration

## Local development

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000` for the landing page
- `http://localhost:3000/intake/demo-token` for the demo intake flow
- `http://localhost:3000/admin/intake` for the admin review screen

## Supabase

The database schema and local Supabase config live under `supabase/`.

One-time setup for a remote project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

Or run the PowerShell helper:

```powershell
.\scripts\setup-supabase.ps1
```

The helper will try to infer the project ref from `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, then prompt for the Supabase access token, database password, and secret key if they are not already set. If you provide a secret key, it also writes `SUPABASE_SECRET_KEY` into `.env.local`.

Push local migrations to Supabase:

```bash
npm run db:push
```

Reset the local Supabase database and replay migrations:

```bash
npm run db:reset
```

This also runs [supabase/seed.sql](D:/Codex/Projects/intake-prd/supabase/seed.sql), which restores the local demo submission and related records.

Push local config changes such as auth redirect URLs:

```bash
npm run db:config
```

Regenerate the TypeScript database types from the linked Supabase project:

```bash
npm run db:types
```

Check that the committed types still match the linked project:

```bash
npm run db:types:check
```

In CI, set `SUPABASE_PROJECT_REF` to the target project ref so the type check can query that project directly.
If you want CI to have access to server-side Supabase credentials for future steps, add `SUPABASE_SECRET_KEY` as a repository secret. `SUPABASE_SERVICE_ROLE_KEY` remains supported for legacy projects.

Dry-run the migration push against the linked project:

```bash
npm run db:migrations:check
```

For that check in CI, set these repository secrets:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

Run the PRD generation worker locally:

```bash
npm run worker:generate
```

For a one-shot run:

```bash
npm run worker:generate:once
```

The worker uses `OPENAI_API_KEY` and `OPENAI_MODEL` when available. Without an OpenAI key it falls back to the deterministic demo generator.
When Supabase is configured, the worker writes the generated Markdown and PDF into the private storage bucket named by `SUPABASE_STORAGE_BUCKET` (default: `generated-documents`) and records the storage keys on the document row.

## Checks

```bash
npm run lint
npm run build
```

## Notes

- The app keeps a local in-memory demo fallback when Supabase env vars are not set.
- Supabase is the chosen path for both database and authentication.
- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the client auth setup.
- Use `OPENAI_API_KEY` and optionally `OPENAI_MODEL` for generation worker runs.
- Use `SUPABASE_STORAGE_BUCKET` to override the private bucket used for generated Markdown and PDF artifacts.
- Use `SUPABASE_SECRET_KEY` for server-side admin/database access when your project is on the newer key model, or `SUPABASE_SERVICE_ROLE_KEY` for legacy projects.
- The same route shape works with either Supabase-backed persistence or demo mode.
