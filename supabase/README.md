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

Guests also open a single match by id (the match details screen). That is one more read of `discover_listings` with an `id` filter, so closed, past and unknown ids simply return no row and there is no new policy, view or migration. The app talks to the database with the publishable key as `anon`; never put a secret or `service_role` key in it, and never widen a table policy to serve guests: new guest reads go through a view with an explicit column list.

### Player directory

Guests and members can browse a list of players through one function, `public.search_players`, which is granted to `anon` and `authenticated`. It is a function rather than a view because it has to enforce limits a view cannot: at most 50 rows per call, nothing from offset 100 onwards, and a negative limit returns nothing. It is `SECURITY DEFINER` with `search_path = ''`, so the tables behind it keep no `anon` grants.

- **Opt-in:** a player appears only if `profiles.discoverable_at` is set (null for every account until they turn on "Show me in Find players"), they have a `home_destination_id`, and they have a padel skill tier. A check constraint stops a profile being listed without a home destination.
- **What is returned:** first name plus last initial ("Jordi M."), home destination, skill tier and a count of matches. `player_id` is returned only to signed-in callers; guests get null. The caller's own row is excluded. Email, consents, trips, bio, the free-text home city and photos are never returned.
- **Search** matches destination name or country with `strpos`, so `%` and `_` are plain characters, and never matches player names.
- **Boundary:** a profile row is still readable by every signed-in user whatever the opt-in. The opt-in controls the directory only. Revisit this before connections ship.
- `tests/rls.mjs` asserts the columns, the opt-in rules, the caps, and that `search_players` is the only non-trigger function `anon` can execute. Any new public function needs the same `revoke ... from public, anon` and an entry here.

Decided boundaries for who can read what:

- **Poster display name and skill tier are public** (through `discover_listings`). Nothing else about a poster is.
- **`profiles` is readable by every signed-in user** (including bio and home city) and by nobody else. Anonymous requests cannot read it. This is deliberate, and `tests/rls.mjs` asserts both halves.
- **Writes always need a signed-in user**, and posting also needs a verified email. There are no joins, participants or messages tables yet, so there is nothing to protect there; when they are added, their policies and tests come with them.
- **Drafts and other statuses** do not exist (a listing is `open` or `closed`). The public view only returns `open` listings, so adding a status later would not expose it by default. It would be its own change, with a migration and tests.

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
pnpm exec supabase gen types typescript --linked --schema public > packages/supabase/src/database.types.ts
```

## Development seed players

`pnpm seed:players` adds four fake, opted-in players (Jordi M., Hannah K., Lucía C., Diego R.) so the Players list has something to show. They are accounts with no password, so nobody can sign in as them, and they use the reserved `@seed.invalid` email domain. It uses the same connection string as the RLS tests (`supabase/tests/.env.local`), so it needs no secret key.

- `pnpm seed:players` only shows what it would do. Add `-- --apply` to write: `pnpm seed:players -- --apply`. It is safe to run again.
- `pnpm seed:players -- --remove` shows what would be removed, and `-- --remove --apply` deletes every `@seed.invalid` account together with its profile.
- The development project is the one the app uses, so seeded players are visible in the running app until removed. Never run it against a production project.

## Security tests

`tests/rls.mjs` checks, for anonymous, owner and other-user cases, that every table and view allows and denies the right things (including that anonymous requests cannot read tables or write anything, see exactly the permitted view columns and no closed or past listings, can read one open match by id and nothing for an unknown id, hold `SELECT` on only the two views and no write privilege anywhere, and cannot call `is_email_confirmed`; that a signed-in user can read another user's profile but an anonymous request cannot; and that no email or consent columns are exposed). It creates test users inside a transaction and rolls everything back.

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
