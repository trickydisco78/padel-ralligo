# Design

## Context

Observed in the code and config (see proposal.md for motivation):

- `@padel/supabase` creates the client with `detectSessionInUrl: false` and the default (implicit) flow, and stores the session in `expo-secure-store`. Nothing in the app calls `resetPasswordForEmail`, `exchangeCodeForSession`, `setSession` or `updateUser`.
- `@padel/auth` owns authentication only: `AuthService` (`currentUser`, `onUserChange`, `signIn`, `signUp`, `signOut`, `setAutoRefresh`), `SessionProvider`, and the sign-in and sign-up screens. `onUserChange` forwards only a user, so the auth event that says "this is a recovery session" is discarded.
- `apps/mobile` composes the guard: `useAppStatus` combines the session with profile completeness into `loading | signedOut | needsProfile | ready`, and `RootStack` uses `Stack.Protected` per state. A recovery link produces a normal session, so today it would drop the user on Home.
- The app scheme is `padel-ralligo`; `expo-linking` and `expo-router` are installed. In Expo Go links use `exp://<host>/--/…`, not the scheme.
- The hosted project's Site URL is `http://localhost:3000`. `supabase/config.toml` only configures local development.
- The sign-up trigger requires terms and age metadata; this does not affect recovery.

## Goals / Non-Goals

**Goals:**
- Recovery and verification links work end to end on a real device, in production builds and in Expo Go.
- A recovery session can never be mistaken for a normal sign-in.
- No secret from a link reaches logs, messages or the visible route.

**Non-Goals:**
- Social sign-in, OTP or magic-link login, change password inside Profile, resend verification, email template design, custom SMTP, persisting a guest's pending intent across the email round trip (the intent is in memory by design, see guest-first-authentication).

## Decisions

1. **PKCE for links the app requests, plus fragment tokens for dashboard emails.** Set `flowType: 'pkce'` on the client so reset and verification emails requested by the app carry `?code=…` rather than tokens in the URL, and exchange the code with `exchangeCodeForSession`. The link handler also accepts `#access_token=…&refresh_token=…&type=recovery`, because emails sent from the Supabase dashboard have no code verifier and always use that form (this is what the dashboard-sent link did earlier). *Alternative:* stay on the implicit flow, rejected because it puts live tokens in a URL the app generated, and those can end up in OS link history or logs. *Alternative:* PKCE only, rejected because dashboard-initiated recovery (our current workaround for locked-out users) would stop working.

2. **One redirect path per purpose.** PKCE redirects carry only `code`, with no `type`, so the app tells the purpose from the path: `reset-password` for recovery and `email-verified` for sign-up verification, both built with `Linking.createURL(path)`. That yields `padel-ralligo://reset-password` in builds and `exp://<host>/--/reset-password` in Expo Go with no per-environment code. The Supabase allow-list needs `padel-ralligo://**`, plus `exp://**` in the development project only.

3. **Link parsing is a pure function in `@padel/auth` domain.** `parseAuthLink(url, purpose)` returns a discriminated result: `{ kind: 'code', code }`, `{ kind: 'tokens', accessToken, refreshToken }`, `{ kind: 'error', reason: 'expired' | 'invalid' }` (read from `error`, `error_code` and `error_description` in the query or fragment) or `{ kind: 'none' }`. It never returns the raw URL and has unit tests with fixtures for each shape. The service performs the exchange: `completeFromLink(link)` returns `{ ok: true } | { ok: false, reason: 'expired' | 'invalid' | 'other_device' }`.

4. **A recovery session is a first-class session status.** `AuthService.onUserChange` emits `{ user, recovery }`, where `recovery` is true after the client's `PASSWORD_RECOVERY` event and until a password update or sign-out. `SessionStatus` gains `recovering`, `deriveAppStatus` maps it to `recovering`, and `RootStack` shows only the `reset-password` screen for that state, in the same way `profile-setup` is held for `needsProfile`. *Alternative:* a flag in the new-password screen's local state, rejected because the session is already a full session and any other screen could be reached by a deep link while it exists.

5. **Abandoning recovery signs the user out.** Leaving the new-password screen (Cancel, back, or the screen unmounting without success) calls `signOut`. The user proved control of the email but not the intention to be signed in, and an open recovery session is the weakest state to leave behind. If the app is killed mid-recovery the stored session restores as an ordinary signed-in session; accepted because the link already proved ownership of the account's email, and noted under Risks.

6. **Reset ends other sessions.** After `updateUser({ password })` succeeds, call `signOut({ scope: 'others' })`. Failure of that second call is logged without detail and does not block the user, since the password has already changed.

7. **No account enumeration.** `requestPasswordReset` always resolves to the same `{ ok: true }` for well-formed addresses and for unknown ones. Only transport failures and rate limiting map to a separate `try_later` result, which says nothing about the account. Supabase itself returns success for unknown addresses; the app must not add a distinguishing message. Sign-in already reports one generic error.

8. **Verification return.** `signUp` passes `emailRedirectTo` for the `email-verified` path. The verified screen tries `completeFromLink`; if the exchange fails because the code verifier lives on another device, the server has still confirmed the address, so the screen says "Email verified, please sign in" for a `code` link and shows the invalid-link message only for a parsed error. This is the only case where a failed exchange is presented as success, and it applies only to the verification path.

9. **Secrets never leave the handler.** The handler reads the URL once through `Linking`, passes the parsed result to the service, then calls `router.replace` to the clean route. It never logs the URL or the parse input and has no `console` calls. Error objects from Supabase are mapped to reasons before they leave `@padel/auth`, so messages like "invalid JWT …" cannot be displayed. The routes exist, so Expo Router's unmatched-route screen (which displays the path) is never shown for these links.

10. **Where things live.**
    - `@padel/auth`: `parseAuthLink`, the new service methods, `ForgotPasswordScreen`, `ResetPasswordScreen`, the verified-email screen, `useAuthLink` hook, locale additions (`forgotPassword.*`, `resetPassword.*`, `emailVerified.*`, `link.errors.*`).
    - `@padel/supabase`: the `flowType` setting only.
    - `apps/mobile`: routes (`forgot-password`, `reset-password`, `email-verified`), mapping `recovering` in `useAppStatus` and `RootStack`, and constructing redirect URLs with `expo-linking`. Redirect URLs are built in the app and passed into the service, so `@padel/auth` does not depend on `expo-linking`.

11. **Password rules reuse sign-up.** Minimum length reuses `MIN_PASSWORD_LENGTH`; the confirmation field is checked in the domain validator (`validateNewPassword`) and returns translation keys like the other validators. The project's server-side minimum is set to match in the dashboard so the two cannot disagree.

12. **Dashboard configuration is a tracked manual task, not code.** Site URL, redirect allow-list, "Confirm email", minimum password length, and a note that the built-in email sender is rate limited and unsuitable for launch are done by the project owner and recorded in `supabase/README.md`.

## Risks / Trade-offs

- [Code verifier lost (reinstall, other device) so PKCE exchange fails] → For recovery, show "link no longer valid, request a new one"; for verification, treat as verified per decision 8.
- [Recovery session persists if the app is killed on the new-password screen] → Accepted; a restored session is an ordinary session for the same verified owner. Revisit if a stronger rule is wanted (for example storing a "recovering" marker in secure storage).
- [`exp://**` in the allow-list is broad] → Development project only; the spec requires the production list to omit it and the README checklist says so.
- [Switching to PKCE changes the sign-up verification link format for in-flight emails] → Links already sent still work through the token path; no migration needed.
- [Expo Go's address changes with the network] → Use `exp://**` in the dev project rather than a specific host.
- [Built-in Supabase email sending is rate limited (a few messages per hour)] → Generic "try again later" message; recommend custom SMTP before launch.
- [A hot-reload or navigation race handles a link twice] → The handler marks a link as consumed by value in memory so a second delivery of the same URL is ignored.

## Migration Plan

1. Merge the i18n change first.
2. Land the code behind the new routes. Until the dashboard is configured the emails still point at localhost, so nothing changes for users.
3. Configure the dev project's dashboard, then test with Expo Go (reset and verification, same-device and other-device).
4. Configure the production project when one exists, without the `exp://` entry.
5. Rollback is a revert; there is no schema change. Reverting leaves the dashboard settings in place, which are harmless.
