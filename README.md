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

Push local migrations to Supabase:

```bash
npm run db:push
```

Reset the local Supabase database and replay migrations:

```bash
npm run db:reset
```

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

## Checks

```bash
npm run lint
npm run build
```

## Notes

- The app keeps a local in-memory demo fallback when Supabase env vars are not set.
- Supabase is the chosen path for both database and authentication.
- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the client auth setup.
- The same route shape works with either Supabase-backed persistence or demo mode.
