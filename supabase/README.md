# Supabase

SQL migrations, seed data and security tests for the hosted Supabase project. There is no local database (Docker is not required): migrations are pushed to a **dev project** that holds no real users.

## What is here

| Path | Purpose |
| --- | --- |
| `migrations/` | Schema, row-level security and views. Applied in filename order |
| `tests/rls.mjs` | Security checks, run in a transaction that is rolled back |
| `config.toml` | CLI project settings |

Tables: `destinations` (seeded), `profiles`, `profile_sports`, `profile_trips`, `user_consents`, `listings`. Views: `discover_listings`, `destinations_with_counts`. Anonymous visitors can read the two views (and nothing else); signed-in users can only change their own rows.

## Anonymous access

The app can be browsed without an account. The two views run with the owner's rights (`security_invoker = false`) and are granted to `anon`; the tables have no `anon` grants, so profiles, trips, consents and raw listings stay unreadable. Anonymous requests see only open, current listings and these columns: destination, dates, start time, venue, level wanted, players needed, description, poster display name and skill tier (plus destination counts). `poster_id` is deliberately not exposed. Adding a column to either view widens public access, so `tests/rls.mjs` asserts the exact column list; update it only on purpose.

## One-time setup

1. Create a Supabase project (a dev project, no real users). In Authentication → Providers → Email, keep **Confirm email** on: posting a listing needs a verified email.
2. Log in and link, from the repository root:
   ```bash
   pnpm exec supabase login
   pnpm exec supabase link --project-ref <project-ref>   # the part before .supabase.co
   ```
3. Give the app its public settings. Copy `apps/mobile/.env.example` to `apps/mobile/.env.local` and fill in the project URL and the **publishable** (anon) key. Never put a secret or `service_role` key in the app.

## Applying migrations

```bash
pnpm exec supabase db push --dry-run   # see what would be applied
pnpm exec supabase db push --linked    # apply to the linked project
pnpm exec supabase migration new <name>  # create a new migration file
```

Migrations are additive and are never edited after they have been pushed; add a new one instead. After a schema change, regenerate the app's types:

```bash
pnpm exec supabase gen types typescript --linked --schema public > apps/mobile/src/lib/database.types.ts
```

## Security tests

`tests/rls.mjs` checks, for anonymous, owner and other-user cases, that every table and view allows and denies the right things (including that anonymous requests cannot read tables or write anything, see exactly the permitted view columns and no closed or past listings, and that no email or consent columns are exposed). It creates test users inside a transaction and rolls everything back.

It needs a Postgres connection string. In the Supabase dashboard open Connect, choose **Session pooler**, and save the string (with your database password) in `supabase/tests/.env.local`, which is git-ignored:

```
SUPABASE_DB_URL=postgresql://...
```

Then run:

```bash
pnpm test:rls
```

Every line should say `PASS`. Run it after every migration.

## Notes

- The Supabase CLI logs in with a short-lived role, so `db push` does not need the database password.
- Free-tier projects can pause when idle, and the built-in email sender is rate-limited and only reaches your own team's addresses. Use a custom SMTP provider before inviting real users.
- The app only ever uses the publishable key. The `service_role` / secret key bypasses row-level security and must never be shipped in the app.
