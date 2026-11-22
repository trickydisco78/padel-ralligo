# Tasks

## 1. Dependencies and test setup

- [x] 1.1 Read the SDK 58 docs for Reanimated install, Babel and Expo Go support and the `expo-splash-screen` plugin options (versioned pages from `https://docs.expo.dev/versions/v58.0.0/`, plus `llms.txt`); note the pages used in the commit message; verify the notes confirm Babel needs no manual step
- [x] 1.2 Run `npx expo install react-native-reanimated react-native-worklets` in `apps/mobile`; verify `npx expo install --check` reports no new mismatches, `pnpm install` leaves a consistent lockfile, and the app still opens in Expo Go
- [x] 1.3 Add the Reanimated jest setup (its mock) to the mobile jest config; verify with a throwaway render of an `Animated.View` and an animated SVG circle that the suite runs, then delete the throwaway

## 2. Timeline and decision logic (pure)

- [x] 2.1 Write `timeline` tests first: `seg` and the easings at their boundaries; `markFrame(0)` has no visible part; `markFrame(1)` has all balls at radius 4.5, the cell 28 wide, every dash offset 0 and the opening ball gone; segment boundaries match the design (balls at 1100, 1250, 1400 ms; cell 1700 to 2050; fourth ball 2000 to 2300; wordmark 2200 to 2700); the wordmark is fully opaque at progress 1. Watch them fail, then implement `src/splash/timeline.ts` with `TOTAL_MS = 2700`; verify the suite passes
- [x] 2.2 Write `introFor` tests first (unseen and native is full; seen, unreadable, reduced motion and non-native are short), watch them fail, implement it; verify they pass
- [x] 2.3 Write `intro-seen` tests first with a fake store (read returns the stored flag, a failed read counts as seen, `markIntroSeen` writes `launch.introSeen`, non-native never touches the store), watch them fail, implement on `expo-secure-store`; verify they pass

## 3. Components

- [x] 3.1 Write `FourthMark` tests first (renders the start frame empty and the end frame complete via the Reanimated mock; colours come from tokens), watch them fail, add `src/splash/fourth-mark.tsx` from the supplied file using `timeline.ts` and `@padel/ui` tokens; verify they pass
- [x] 3.2 Write `AnimatedSplash` tests first with fake timers (waits for both `ready` and the intro; fades 300 ms then calls `onFinish` exactly once; `onShown` once; `short` and reduced motion fade right after `ready`; the label is the translated string), watch them fail, add `src/splash/animated-splash.tsx` with the `intro` prop and the translated label; verify they pass
- [x] 3.3 Add `launch.loading` ("Fourth, loading") to the app locale and verify the label test uses it

## 4. Wiring

- [x] 4.1 Write an `AppShell` integration test first (overlay shown while the app status is loading, first launch plays the full intro and does not leave early, a later launch fades once ready, `SplashScreen.hideAsync` called once, the seen flag written only at the end, a throwing read still starts the app), watch it fail, add `LaunchSplash`, render it in `AppShell`, and remove the fonts-ready `hideAsync` effect from `_layout.tsx`; verify the test and the existing app tests pass
- [x] 4.2 Copy `splash-blank.png` to `apps/mobile/assets/images/` and change the `expo-splash-screen` entry in `app.json` (pink `#E6005C`, that image); verify `npx expo config --type public` shows the new splash settings with `name`, `slug` and `scheme` unchanged, and `npx expo-doctor` has no new errors
- [x] 4.3 Adopt the app icons: view each source PNG first (icon is the pink court mark with the black fourth square; the adaptive foreground keeps its safe margin; favicon is 48 px), copy `icon.png`, `adaptive-icon.png` and `favicon.png` over `assets/images/icon.png`, `android-icon-foreground.png` and `favicon.png`, set `android.adaptiveIcon.backgroundColor` to `#E6005C`, remove `backgroundImage` and the now-unused `android-icon-background.png`, and point `ios.icon` at `./assets/images/icon.png` (remove the unused `assets/expo.icon`); leave `name`, `slug`, `scheme`, `bundleIdentifier` and `monochromeImage` as they are; verify `npx expo config --type public` shows the new icon paths and the unchanged identifiers, and note that icons show only in a native build, not Expo Go

## 5. Integration and checks

- [x] 5.1 Run `pnpm turbo run check-types lint test` and verify every task passes
- [ ] 5.2 In Expo Go on the iOS simulator, clear the app data, cold start and verify: full intro plays, "fourth." ends fully visible, the screen fades once the app is ready; relaunch and verify the short version; turn on Reduce Motion and verify no drawing animation
- [ ] 5.3 On a real native build for iOS and Android, verify the system splash is plain pink with no flash into the overlay, and that the app icon shows the new mark (on Android also check the themed icon and record the monochrome gap) (blocked locally by the Xcode 26.3 `expo-modules-jsi` error; use an EAS development build or retry after an Expo fix)
- [ ] 5.4 Move `apps/mobile/assets/files/` to `docs/design/fourth-splash/` as the design reference, re-check that `apps/mobile/assets/files.zip` is identical to the folder and remove it, and verify `git status` shows nothing under `apps/mobile/assets/files`; leave `docs/Fourth loading animation.html` where it is; update backlog issue #39 to note the launch screen is done and the shared in-app loader remains, and issue #40 to note which assets and wordmarks this change already moved

## Workflow follow-up

- Archive after review, then plan the rebrand (issue #40: Logo atom, Home wordmark, app display name, technical identifiers) as its own change.
