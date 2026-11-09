# Tasks

## 1. Database access for anonymous reads

- [x] 1.1 Confirm tasks 1.5 and 1.6 of `add-accounts-profiles-listings` are done (or agree they are folded in here), so this change adds a new migration on top rather than editing pushed ones; verify by listing `supabase/migrations/` and the open tasks
- [x] 1.2 Add a migration that recreates `discover_listings` and `destinations_with_counts` with owner rights, explicit columns (no `poster_id`, email or consent fields), keeping the open and current-date filters, and grants select to `anon` and `authenticated`; verify `supabase db push` to the dev project succeeds and the anon key can read both views
- [x] 1.3 Extend `supabase/tests/rls.mjs` with anonymous cases: views readable with exactly the permitted columns; `profiles`, `profile_sports`, `profile_trips`, `user_consents` and `listings` not readable; inserts, updates and deletes rejected; closed and past listings absent; verify `pnpm test:rls` passes against the dev project and fails if a column is added to a view
- [x] 1.4 Update `supabase/README.md` to describe anonymous access and the new test cases; verify the documented command runs as written

## 2. Routing and sign-in prompt

- [x] 2.1 Add a `SignInPrompt` component (message, "Sign in" and "Create an account" actions) with a test that both actions navigate to the auth screens; verify with `pnpm --filter mobile test`
- [x] 2.2 Change `RootStack` so `(tabs)` is shown for `signedOut` and `ready`, `(auth)` stays available when signed out, and `profile-setup` is unchanged for `needsProfile`; update `route-guard.test.tsx` for all four statuses, and verify a visitor lands on the tabs and a sign in moves them to the tabs or profile setup
- [x] 2.3 Gate `create`, `matches` and `profile` with `SignInPrompt` when signed out; add a test per screen for visitor and signed-in rendering, and verify no profile data or form renders for a visitor
- [x] 2.4 Make sure sign in, sign up and sign out end on the right screen (sign out returns to signed-out Home); update `sign-out.test.tsx` and `auth-screens.test.tsx` and verify they pass

## 3. Home screen and tabs

- [x] 3.1 Move Discover to a `discover` route and add `destinationId` param handling (explicit param beats the saved-trip prefilter); add tests for param, trip and neither, and verify with `pnpm --filter mobile test`
- [x] 3.2 Build the Home screen (welcome with visitor-only call to action, destination shortcuts with counts, five upcoming games with "See all games", empty and per-section error states, refresh on focus); add component tests for visitor, signed-in, empty, error and shortcut navigation, and verify they pass
- [x] 3.3 Update `app-tabs.tsx` to Home, Discover, Create, Matches, Profile with icons, and the launch route to Home; update tab tests and verify the tab order and labels
- [x] 3.4 Run `pnpm lint`, `pnpm check-types` and `pnpm test` at the repo root and verify all pass

## 4. End-to-end verification

- [ ] 4.1 Run the app in the iOS simulator against the dev project and verify: cold start signed out lands on Home with games and counts; Discover filters work; Create, Matches and Profile show the sign-in prompt; sign in from Home returns to the tabs; sign up leads to profile setup; sign out returns to signed-out Home
- [x] 4.2 Verify with the anon key from a script or the RLS test that anonymous requests cannot read profiles or write anything, and update `README.md` and `docs/` so the documented behaviour (anonymous browsing, gated features) matches the app
