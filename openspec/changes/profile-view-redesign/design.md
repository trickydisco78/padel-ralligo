# Design

## Context

- `ProfileView` (packages/profiles) renders `ProfileHeader`, a pink player card with an overline, a ball badge, name, pin and tier tag, then About and Edit profile. The Profile tab screen (`apps/mobile/src/app/(tabs)/profile.tsx`) wraps it in a padded scroll view under a "Profile" display title, then trips, listings and sign out.
- The artboard "Member · Profile" (`MemberProfile.dc.html`, identical to `MyProfile`) is a full-bleed layout: a 190 px pink hero with two decorative circles, a white sheet with 34 px top corners starting 40 px up inside the hero, a 104 px initials avatar straddling the join, a centred name, a muted "Level · place" line, an Edit profile outline pill, a pink level card, stats, and the next match.
- Every colour in the artboard already exists as a token (`pink500` hero, `pink400`/`pink600` circles, `pink200` pill border, `pink700` pill text, `ink` and `pink300` avatar, `muted`, `surfaceSoft`). `radius.xl` is the 34 px sheet and `radius.lg` the 28 px card. `FeatureCard` already draws the two circles.
- `Avatar` has an `xl` size (96, rounded tile with a ring) that differs from the artboard's round 104 px avatar with a 5 px ring.
- The profile stores display name, home city, bio and skill tier only. There is no numeric level, wins, side or photo.

## Goals / Non-Goals

**Goals:**
- The view matches the artboard's structure and styling for everything the data supports.
- Colours, radii and type come from tokens; copy from the `profiles` locale file; the layout works at large text sizes.
- The reducer, view modes, edit form and everything below the view are untouched.

**Non-Goals:**
- Numeric level, trend chip or chart, Wins, Side, matches played, profile photo and camera badge, the settings button, "Your next match", the guest profile and the floating tab bar. Each is logged as a backlog item.
- Changing `ProfileForm` or the edit mode's look. Editing keeps its current form; only the view is restyled.

## Decisions

1. **The tier stands in for the numeric level.** The "Your level" card shows the tier label (for example "Intermediate") in the big type slot. It is left out when there is no tier. Alternative: show the card with a dash. Rejected: an empty card says less than no card, and the form requires a tier, so it is rarely missing.
2. **Hero and sheet live in `ProfileView`; the screen stops padding and titling it.** The artboard has no "Profile" title and is edge to edge, so the screen renders the view outside the padded container and keeps the form, trips, listings and sign out in a padded section below. Alternative: leave the padded layout and inset the hero. Rejected: it cannot overlap the screen edges.
3. **A local `ProfileHero` component in `packages/profiles`, not a shared one.** Only this screen uses it today. If the player profile (artboard 9) is built later, it moves to `@padel/ui` then. `FeatureCard` is reused for the level card, since it already has the circles and radius.
4. **A new avatar size rather than a new component.** Add an optional round `hero` look to `Avatar` (104, 5 px white ring, ink background, `pink300` initials) instead of building a second avatar. The `xl` tile is left for the player card. This touches `@padel/ui`, so it gets a small test there.
5. **Pure view data stays out of the component.** A small pure function returns the parts of the identity line (`tier`, `city`) joined with " · " and skipping missing parts, with a unit test. No reducer change.
6. **Safe at large text.** The name has no fixed height and wraps to two lines; the sheet's top padding is the avatar's overlap, so the name starts below the avatar whatever the text size. The hero height is fixed because it holds only decoration.
7. **Edit profile keeps its role and label.** It stays a real button named "Edit profile", restyled as the outlined pill with a pencil icon (`edit` exists in the icon set). Existing tests for the button keep passing.
8. **Backlog items, not tickets in code.** The out-of-scope list is recorded in `docs/backlog.md` and the GitHub project in the apply phase, after the user agrees.

## Risks / Trade-offs

- The hero's overlap relies on absolute positioning; on small phones the avatar could touch the status bar area. Mitigated by safe-area top padding on the hero and a snapshot-free layout test that the name sits below the avatar.
- The view no longer uses `ProfileHeader`, which remains exported for the player card. If nothing else adopts it, it becomes dead code; flag it for a later clean-up rather than deleting it here.
- The design's numbers (3.42, 24, 15) cannot be shown, so the screen is plainer than the artboard until those fields exist. Accepted by the user.
- Existing `ProfileView` tests assert uppercase badge text (`INTERMEDIATE`); they change because the tier moves to the line and the card.

## Open Questions

- None blocking. Whether to keep the "Profile" page title for screen readers (a visually hidden heading) is assumed yes and checked on a device in the manual task.
