# Database delivery (migrations, tests, seeds)

How Supabase migrations are validated and applied. Current stage: proof of concept, one Supabase project (dev), solo or small team.

## Current approach

Workflow: `.github/workflows/supabase.yml`. The Supabase CLI comes from the repo's `supabase` dev dependency (`pnpm exec supabase`).

| Trigger | Job | What it does |
| --- | --- | --- |
| Pull request touching `supabase/**` | `validate` | Starts a throwaway local Supabase in Docker, applies every file in `supabase/migrations/`, runs `supabase/tests/rls.mjs`, then discards the database. No secrets; nothing remote is touched. |
| Push to `main` changing `supabase/migrations/**`, or manual run | `deploy-dev` | Needs `validate` to pass. Links the dev project, prints `supabase db push --dry-run`, then applies `supabase db push`. Runs in the `dev` GitHub environment. |

Rules:
- Migrations are forward-only. Fix a bad migration with a new one; never edit one that has been applied.
- `db push` applies only migrations missing from the project's migration history, in filename order.
- Never change the dev schema by hand in the dashboard; every change is a migration file.
- Seeds are not part of the pipeline (see below).

### Setup (once per environment)

In GitHub, **Settings → Environments → `dev`**:

| Name | Type | Notes |
| --- | --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Secret | Account token from the Supabase dashboard (Account → Access Tokens). Project-scoped to the dev project, Project read and Database read/write, expiry 90 days. Rotate before it expires or `deploy-dev` fails with an auth error. |
| `SUPABASE_DB_PASSWORD` | Secret | The project's database password (reset under Project Settings → Database if lost; this changes it everywhere it is used). |
| `SUPABASE_PROJECT_REF` | Variable | The project id (from the dashboard URL). An identifier, not a credential. |

Optional: add required reviewers to the `dev` environment to gate deploys.

### Local checks

- `pnpm test:rls` runs the RLS checks against the dev project (needs `supabase/tests/.env.local`, gitignored). Everything runs in a rolled-back transaction. A stray "Test P." profile in dev makes 5 directory checks fail locally; they pass on the clean CI database.
- No Docker is needed for this; CI does the local-database run.

## Seeds

- `supabase/seed/*.mjs` (`seed:players`, `seed:matches`, `seed:testers`) are manual, dry-run by default, and only for dev. They create `@seed.invalid` accounts. `seed:testers` creates sign-in accounts and a match with requests; set `SEED_TESTER_PASSWORD` to keep its password fixed.
- Never seed staging or production.
- Account lists and passwords for local testing go in a `*.local.md` file, which is gitignored.

## Future considerations

Revisit when the app has real users or a launch date.

1. **Separate production project.** Dev and prod never share a database.
2. **Staged deploys.** Keep `main` → dev automatic. Add a `production` environment: its own secrets and variable, required reviewers, and the dry-run shown before approval. Same workflow, one more job.
3. **Backups and rollback.** Migrations only go forward, so a backup is the rollback. Take a backup (Pro plan backups, or a point-in-time recovery add-on) before production migrations.
4. **Safe migrations.** Make each change compatible with the app version already live: add first, remove later. Avoid long locks on large tables. Deploy the migration before the app build that needs it.
5. **Supabase Branching (optional).** A per-PR preview database built from the migrations, including hosted services such as auth and storage. Most useful with a larger team or a QA step that needs a shareable preview. It is a paid-plan feature billed per running branch. The local-Docker `validate` job covers most of the same ground, so add Branching only if there is a real gap. Confirm plan requirements and pricing with Supabase before deciding.
6. **Supabase GitHub integration (alternative).** Applies migrations on merge with no workflow to maintain, but has no RLS test gate, approval step or dry-run output. If adopted later, keep the `validate` job and remove `deploy-dev` so two things never apply migrations to the same project.
7. **Plan limits.** The free plan limits the number of active projects and pauses idle ones. Check the current limits before creating a prod project.
8. **Token hygiene.** Use a separate, project-scoped token per environment, with calendar reminders for expiry.
