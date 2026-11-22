# Backlog

Each ticket is written so an agent can pick it up from this file alone: ask for it by its heading, for example "do the ticket *Type the remaining view states*".

## Type the remaining view states

**Why.** `CLAUDE.md` (View states, Reducer events) says every view state is a string-literal union and every reducer event is an UPPER_SNAKE_CASE fact. `ProfileForm` and `MatchActions` follow it; the places below still use parallel booleans that can contradict each other (for example `posting` and `posted` both true).

**Scope.** Each row is one commit, test-first (keep the screen's existing tests green, add a test for any state that had none).

| Where | Today | Becomes |
|---|---|---|
| `packages/listings/src/presentation/components/listing-form.tsx` | `posting`, `posted` | `ListingFormState = 'editing' \| 'posting' \| 'posted' \| 'failed'` |
| `packages/auth/src/presentation/screens/sign-up-screen.tsx` | `submitting`, `done`, `formError` | `SignUpState = 'editing' \| 'submitting' \| 'done'`, with the server error as a typed value |
| `packages/auth/src/presentation/screens/sign-in-screen.tsx` | `submitting` | `SignInState = 'editing' \| 'submitting'` |
| `packages/auth/src/presentation/auth-intent.tsx` | `intent`, `sheetOpen` | one state union for the prompt sheet |
| `apps/mobile/src/app/(tabs)/discover.tsx` | 16 `useState` calls, including `seenUserId`, `appliedView`, `appliedParam`, `filterVersion` that only sync derived state | a reducer in the domain layer with events such as `FILTERS_CHANGED`, `TRIP_SELECTED`, `USER_CHANGED`, behind a `useDiscover` hook (the `useManageMatch` pattern) |

Larger forms with many field `useState` calls (`listing-form`, `profile-form`, `trips-section`) are a separate question: a field reducer or a form library. Leave them out.

**Pattern to copy.**
- Reducer plus pure view function: `packages/listings/src/domain/manage-match-state.ts`, `manage-view.ts`, and the hook `use-manage-match.ts`.
- Status union in a form: `ProfileFormState` in `packages/profiles/src/presentation/components/profile-form.tsx`.

**Done when.**
- No `useState<boolean>` remains for a view state in the files above (single independent toggles are fine).
- Every reducer event follows the `CLAUDE.md` rule.
- `pnpm turbo run check-types lint test` passes.
- Behaviour and copy on screen are unchanged, apart from `discover.tsx` no longer needing its sync workarounds.

**Out of scope.** New features, a state-management library (see the decision to wait until state must be shared across screens), the public profile, Apple and Google sign-in.

**Notes.**
- `discover.tsx` is the riskiest row; do it last and on its own.
- A new OpenSpec change is only needed if on-screen behaviour changes; this is a refactor.
