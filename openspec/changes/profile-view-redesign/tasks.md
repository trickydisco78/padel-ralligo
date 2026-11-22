# Tasks

## 1. Identity line and avatar (tests first)

- [x] 1.1 Write a failing unit test for a pure function that joins skill tier and home city with " · ", skipping missing parts, then implement it
- [x] 1.2 Write a failing test for the round hero `Avatar` look (size, ring, initials, hidden from screen readers unless labelled), then add it to `@padel/ui`

## 2. View layout (tests first)

- [x] 2.1 Rewrite the `ProfileView` tests for the new layout: name as heading, identity line, Edit profile button, level card with the tier, About or Add a bio prompt, and the missing-detail cases from the spec
- [x] 2.2 Add `profileView.yourLevel` to `packages/profiles/src/locales/en.json`
- [x] 2.3 Build `ProfileHero` (pink band, circles via tokens, sheet overlap, avatar) and the level card from `FeatureCard`, then restyle `ProfileView` and the Edit profile pill until 2.1 passes
- [x] 2.4 Add a test that the name wraps and stays below the avatar at a large font scale

## 3. Screen

- [x] 3.1 Update `apps/mobile/src/app/(tabs)/profile.tsx` so the view renders edge to edge, with the form, trips, listings and sign out in a padded section below; keep a screen-reader title
- [x] 3.2 Update or add a screen test that view mode shows the new layout and edit mode still shows the form, Save and Cancel

## 4. Verify and record

- [x] 4.1 Run `pnpm turbo run check-types lint test` and confirm every task passes
- [ ] 4.2 In Expo Go on the iOS simulator, compare the Profile tab with the "Member · Profile" artboard (hero, avatar overlap, pill, level card, About), check a long name, a profile with no bio and city, and large text
- [ ] 4.3 After the user agrees, add the out-of-scope items (numeric level and trend, Wins and Side and matches played, profile photo, settings button, "Your next match", guest profile redesign, floating tab bar) to `docs/backlog.md` and the GitHub project
