# Proposal

## Why

Supabase sends two emails the app cannot finish today: sign-up verification and password recovery. Both links point at the project's Site URL, which is still `http://localhost:3000`, and even with a correct URL the app has no screen that receives a link, turns it into a session, or lets the user choose a new password. Account recovery is therefore impossible without dashboard intervention, and email verification (which gates posting a match) cannot be completed from a phone.

## What Changes

- Add a **Forgot password** request screen, reachable from Sign in, that asks Supabase to email a reset link whose redirect is the app's own deep link.
- Add **deep-link handling** for auth emails: recovery and email-verification links open the app, are exchanged for a session, and land on the right screen. Both link formats are accepted (PKCE `?code=` and implicit `#access_token=`), because emails sent from the Supabase dashboard cannot use PKCE.
- Add a **Set new password** screen. A recovery session is held at this screen (like profile setup) and is not treated as a normal sign-in until the password is changed. Leaving it signs the user out again.
- After a successful reset, end the user's **other sessions**.
- Switch the Supabase client to the **PKCE flow** for links the app requests, so tokens never appear in a URL the app itself generated.
- Add a verification return route so the sign-up email's link brings the user back to the app, with a clear message when the link is expired or already used.
- Show a message, never a blank screen, for invalid, expired or reused links.
- Keep tokens out of logs, error messages and the router's unmatched-route screen.
- All new copy goes in the existing per-package locale JSON (`auth` namespace).
- Document and apply the **Supabase dashboard configuration** (Site URL, redirect allow-list, minimum password length, confirm email) as explicit manual tasks.
- **Out of scope:** Google, Apple or other social sign-in; magic links and OTP codes; a change-password screen for signed-in users; resending the verification email; custom email templates or branding; a custom SMTP provider (recommended before launch because the built-in sender is heavily rate limited, but it is configuration, not code); persisting a guest's pending intent across the email round trip.
- **Prerequisite:** the i18n change (`feat/extract-copy-to-json`) should be merged first, because the new screens use its locale structure.

## Capabilities

### New Capabilities
- `password-recovery`: requesting a reset link, setting a new password from a recovery link, holding the recovery session, ending other sessions, and not revealing whether an account exists.
- `auth-email-links`: how links from authentication emails reach the app, are validated and exchanged for a session, how invalid or expired links are reported, and that tokens are never exposed.

### Modified Capabilities
- `user-accounts`: sign in offers password recovery; the email verification link returns to the app and completes verification there.
- `session-lifecycle`: a recovery session is a distinct state that holds the user at the new-password screen, and is ended if abandoned.

## Impact

- **Code:**
  - `packages/auth`: `AuthService` gains `requestPasswordReset`, `completeFromLink` and `updatePassword`; new pure `parseAuthLink`; new `ForgotPasswordScreen` and `ResetPasswordScreen`; `signUp` passes `emailRedirectTo`; session status gains `recovering`; locale JSON additions.
  - `packages/supabase`: client uses `flowType: 'pkce'`.
  - `apps/mobile`: routes for `forgot-password`, `reset-password` and `email-verified`; a link-handling component; `RootStack` guard for the recovering state; `expo-linking` for building redirect URLs per environment (app scheme in builds, `exp://` in Expo Go).
- **Dependencies:** none new (`expo-linking` is already installed).
- **Supabase (manual, dev and production projects):** Site URL, redirect allow-list for `padel-ralligo://**` and, for development only, `exp://**`; password minimum length of 8 to match the app; "Confirm email" on.
- **Tests:** link parsing, service calls against a fake client, screens, route guard for the recovering state, and the no-enumeration behaviour.
- **Docs:** `supabase/README.md` (dashboard configuration and how to test with Expo Go).
