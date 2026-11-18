# Tasks

Dependencies: merge the i18n change (`feat/extract-copy-to-json`) first. 1 before 2; 2 before 3 and 4; 3 and 4 before 5. 6 can start any time (manual). 7 last.

## 1. Baseline and link parsing (`@padel/auth` domain)

- [ ] 1.1 Run `pnpm check-types`, `pnpm lint`, `pnpm test` on a clean tree and record the baseline; verify all pass before any change
- [ ] 1.2 Add `parseAuthLink(url)` in `domain/` returning `code`, `tokens`, `error` (expired or invalid, from `error`, `error_code`, `error_description` in query or fragment) or `none`; verify unit tests with fixtures for each shape, both `?` and `#` forms, and that the result never contains the raw URL
- [ ] 1.3 Add `validateNewPassword` (minimum length, both entries equal) returning translation keys like the other validators; verify unit tests including the shared minimum with sign up

## 2. Auth service

- [ ] 2.1 Set `flowType: 'pkce'` on the Supabase client; verify the existing supabase and auth tests pass and sign in and sign up still work against the dev project
- [ ] 2.2 Add `requestPasswordReset(email, redirectTo)` to `AuthService` and the Supabase implementation: same `{ ok: true }` for known and unknown addresses, `try_later` only for rate limit or network errors; verify tests on a fake client for both addresses, rate limit and network failure, and that no result differs by account existence
- [ ] 2.3 Add `completeFromLink(link)` (exchange a code or set a session from tokens) and `updatePassword(password)` followed by `signOut({ scope: 'others' })`; map every Supabase error to a reason (`expired`, `invalid`, `other_device`, `rejected`) so raw messages never leave the package; verify tests for success, expired, reused, missing verifier and rejected password
- [ ] 2.4 Pass `emailRedirectTo` through `signUp`; verify the redirect reaches the client call in a test
- [ ] 2.5 Emit `{ user, recovery }` from `onUserChange` (recovery after `PASSWORD_RECOVERY`, cleared by a password update or sign-out); verify tests that the flag is set, cleared and never leaks to a later user

## 3. Session recovery state

- [ ] 3.1 Add `recovering` to `SessionStatus` and the session provider, keeping a single auth listener; verify provider tests: normal sign-in, recovery, success, sign-out, one subscription
- [ ] 3.2 Abandoning recovery signs out and clears private cache and intent through the existing session cache guard; verify a test that leaving the screen ends the session

## 4. Screens and copy (`@padel/auth`)

- [ ] 4.1 Add `ForgotPasswordScreen` (email field, same confirmation for any address, generic try-later message, back to Sign in) and add "Forgot password?" to Sign in, passing the typed email; copy in `locales/en.json`; verify screen tests including identical confirmation for known and unknown addresses, field errors, and the typed email carried over
- [ ] 4.2 Add `ResetPasswordScreen` (two password fields, validation, rejected-by-server message, success confirmation, cancel signs out); verify screen tests for each outcome
- [ ] 4.3 Add the verified-email screen and the invalid or expired link message with the right next step for each purpose; verify tests for same-device, other-device, expired, reused and unrecognised links
- [ ] 4.4 Accessibility: labelled fields, announced errors and confirmations, 48dp targets; verify with role, label and hint queries in the screen tests
- [ ] 4.5 Export the new API and locale additions; verify lint and `turbo boundaries` pass and `package-exports.test.mjs` still passes

## 5. App composition (`apps/mobile`)

- [ ] 5.1 Add routes `forgot-password`, `reset-password` and `email-verified`; build redirect URLs with `Linking.createURL` and pass them to the service; verify route tests that Sign in reaches Forgot password and Android back returns
- [ ] 5.2 Add the link handler: read the URL from the initial link and from link events, parse, exchange, then replace to the clean route; consume each URL once; no logging; verify tests for cold start link, link while running, duplicate delivery, and that the route and rendered text contain no code or token
- [ ] 5.3 Map `recovering` through `useAppStatus` and `RootStack` so only `reset-password` exists in that state; verify `route-guard.test.tsx` additions: guest opens reset link, signed-in user opens reset link, success reaches the app, abandon returns to Guest, tabs never visible while recovering
- [ ] 5.4 Verify a guest viewing a match who opens a verification link sees the verified message and returns to the match afterwards

## 6. Supabase configuration and docs (manual, project owner)

- [ ] 6.1 In the dev project set Site URL to `padel-ralligo://`, add redirect URLs `padel-ralligo://**` and `exp://**`, set minimum password length to 8 and confirm "Confirm email" is on; verify by requesting a reset from the app and checking the email link no longer points at localhost
- [ ] 6.2 Document the dashboard checklist, the production allow-list rule (no `localhost`, `127.0.0.1` or `exp://`), Expo Go testing and the email rate-limit and custom SMTP note in `supabase/README.md`; verify a reader can follow it as written
- [ ] 6.3 Update `docs/architecture.md` for the recovery state, link handling and where redirect URLs are built; verify it matches the code

## 7. Validation

- [ ] 7.1 Run `pnpm check-types`, `pnpm lint`, `pnpm test`; verify against the baseline from 1.1
- [ ] 7.2 Manually verify on iOS and Android against the dev project with Expo Go: request a reset for a real and an unknown address (same message), open the link on the device and set a new password, sign in with it, confirm another signed-in device is signed out, open an expired or reused link, sign up and verify on the same device and on another device, abandon recovery

## Workflow follow-up

- Archive after the i18n change and `guest-first-authentication` are archived (already done for guest-first).
- Later changes: resend verification, change password in Profile, custom SMTP and email templates, social sign-in.
