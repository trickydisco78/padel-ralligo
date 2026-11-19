<!-- Snapshot of the "Padel Pink Design System" README (Claude artifact), copied 2026-11-19. The artifact is the live source; the app tokens are in packages/ui/design/tokens.json and the app notes in docs/design-reference.md. -->

Source: https://claude.ai/artifact/WD22rDN9bJZfQvDqs1Eh14 (private, needs access)

# Padel Pink

A small design system for a padel app: white screens, one hot pink, big round shapes. Built from the app's court booking, match request and profile screens.

## Content fundamentals

- **Voice:** friendly, short and direct. Say what happens next. "Request to join", "Reserve", "Withdraw request", "You're in!", "Request sent!".
- **Case:** sentence case everywhere, including section headings ("Saved trips", "About this match"). Uppercase is only for tiny overlines on pink surfaces and date tiles ("PLAYER CARD", "THU").
- **People:** shown as initials in a circle, never stock faces. "AM" for Alex Morgan, "CM" for Carlos M. Names are first name plus initial ("Carlos M.").
- **Numbers:** times are 24-hour ("18:30 – 20:00"), levels use one decimal ("Level 3.5 – 4.5"), spots are counted ("1 spot needed").
- **No emoji** in the interface. Icons do that job.

## Visual foundations

- **White first.** Screens are `surface`. Cards sit on white with a hairline `line` border, not a shadow. `surface-soft` is for quiet fills only: neutral badges, inset tiles, disabled controls.
- **One hot pink.** `pink-500` is the brand and the action colour. Use it for the single main button, selected states, map pins and the hero. Everything else stays ink and grey so the pink stays recognisable.
- **Pink text rule.** On white or `pink-100`, small pink text and icons use `pink-700`, because `pink-500` is only safe with white text on top of it.
- **Round everything.** Buttons, pills and badges are `radius-pill`. Cards are `radius-lg`, sheets and the feature card `radius-xl`, tiles `radius-sm`.
- **Shadows are rare.** `shadow-brand` on the primary button, `shadow-float` on the floating tab bar. Nothing else floats.
- **Court motif.** Top-down padel court lines (a rectangle with a net line and service lines) stand in for photos on cards and in heroes. Draw them in `pink-500` on `pink-100`, white on `pink-500`, or `pink-300` on `ink`.
- **Type.** Outfit only. 800 for big titles and numbers, 700 for headings and buttons, 400 to 600 for text. Negative letter spacing on large sizes. See Typography.
- **Spacing.** 20px screen margin (`space-5`), 16px inside cards (`space-4`), 12px between stacked buttons and cards (`space-3`), 8px between pills (`space-2`). Touch targets are at least 44px.
- **Status colours** are soft grounds with dark text: amber for pending, green for accepted, `ink` with a pink cross for declined. Declined is not red, so it never reads as a brand action.

## Iconography

Line icons on a 24px grid, 1.8px stroke, round caps and joins, drawn in `currentColor`. Inactive icons are `ink-soft`; the active tab icon is filled `pink-500`. Icons often sit in a 46px `pink-100` tile with `pink-700` strokes. Inside pills and buttons they shrink to 16 to 20px. See the Icon component for the full set.

## Atomic structure

Components are grouped by how they are built. Build from the bottom up, and never restyle a lower level inside a higher one.

| Level | What it is | Shared components |
| --- | --- | --- |
| Atoms | One element that does one job | Button (with choice pill and icon button), Badge, Icon, Avatar, Input, Checkbox, Radio, Switch |
| Molecules | A few atoms working as one unit | FormField, SearchField, Card (with feature card and status banners) |
| Organisms | A self-contained section of a screen | AppBar, BottomSheet, TabBar |
| Pages | Real screens put together from the levels above | Discover, Match details, Book a court, Edit profile |

If a page needs something new, first try to make it from existing molecules and atoms. Only add a component when the same pattern appears on two screens.

## Shared and domain components

Only generic pieces are shared. A component that needs a domain concept (a player, a profile, a booking) belongs to that domain: it is built from the shared atoms and molecules, and it lives with the domain's code rather than in the shared design-system package.

| Component | Level | Scope |
| --- | --- | --- |
| Button, Badge, Icon, Avatar, Input, Checkbox, Radio, Switch | Atom | Shared |
| FormField, SearchField, Card | Molecule | Shared |
| AppBar, BottomSheet, TabBar | Organism | Shared |
| PlayerRow | Molecule | Domain: players (match participants and their request status) |
| SlotPicker | Molecule | Domain: bookings (dates and start times of a court) |
| ProfileHeader | Organism | Domain: profiles (the player card and stats) |
| EditProfileForm | Organism | Domain: profiles (the profile fields and Save) |
| BookingBar | Organism | Domain: bookings (price and Reserve) |

Domain components may only use shared components, never another domain's.

## Where the built app differs

These were found when the system was implemented in the app. The app is the source of truth for them.

- **Tab bar:** the app uses the platform's native tab bar, restyled with `pink-500` tint, `ink-soft` inactive icons, Outfit labels, a `pink-100` indicator on Android and a filled icon for the active tab where the platform has one. It cannot be a floating pill with its own radius, border and shadow, and cannot carry the Create plus circle. The floating TabBar is kept here as the target for a later custom tab bar.
- **Icons:** there is an `alert` icon (circle with an exclamation mark) for errors, because the field and banner guidelines ask for an alert icon the set did not have. Icons inside the native tab bar are the platform's symbols, not this set.
- **Spacing:** several READMEs say 14px (card padding, player row side padding). There is no 14px token, so the app uses `space-4` (16px).
- **Choice pills:** the Discover view switch is a row of separate choice pills, as the Button guidance asks, not a joined track.
- **Avatar colour** is chosen by the screen (ink, tint or brand), never by the person's name.
- **Skill level** uses radios, as the Forms guidance asks, not pills.
- **Hover** states in Input are web-only and have no equivalent on a phone.

## Forms

- **Label above, always visible.** Never use a placeholder as the label. Labels are sentence case, 14px semibold. Mark optional fields with "Optional" on the right, not required fields with an asterisk.
- **Helper text below** in `muted`, 13px, for what to type or how it is used ("Shown on your player card"). An error replaces the helper.
- **Errors say how to fix it**: "That username is taken. Try alex.morgan2". They use `error-600` with an icon and set `aria-invalid="true"`, so colour is never the only signal.
- **Fields** are 56px tall with `radius-md`, a 1.5px `control` border (3:1 on white) and 16px text (`body-lg`). Focus is a `pink-500` border plus a soft `pink-100` ring. Disabled is `surface-soft` with `muted` text.
- **Checkbox** for choosing many or giving consent, **radio** for choosing one of up to four options, **switch** for something that takes effect straight away. Each row is at least 44px tall and the label is part of the target.
- **Choice pills** (see Button) are for filtering lists, not for form answers.
- **One primary button** ends the form ("Save changes"), full width and docked at the bottom.

## Using it in a native app

The tokens are the source of truth: map each colour, size, radius and type style to your platform's theme. Bundle Outfit (open source, SIL OFL) with the app rather than loading it from the web. The component previews here are web references for the look and the measurements.
