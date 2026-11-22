# Proposal

## Why

Launch looks unfinished. The native splash is the default Expo blue (`#208AEF`) with the template icon, and after it `RootStack` shows a bare spinner until the session status arrives. A design now exists (canvas artboards Loading 1 to 4 and `docs/Fourth loading animation.html`) and so does a starting implementation (`apps/mobile/assets/files/`: `FourthMark.tsx`, `AnimatedSplash.tsx`, a plain-pink native splash setup). Backlog issue #39 tracks it.

## What Changes

- **An animated launch screen** on a pink (`#E6005C`) full-screen overlay: the court draws itself, three balls arrive, the fourth square fills, and the wordmark **"fourth."** rises in. The last ball then pulses until the app is ready.
- **It stays until the app is ready:** fonts loaded and the first session and profile status known. It then fades out over 300 ms and is removed.
- **Full intro on first launch only.** Later launches show the finished mark and fade out as soon as the app is ready. The "intro seen" flag is stored on the device.
- **Reduced motion** shows the finished mark and only fades.
- **Native splash becomes plain pink** (a transparent image), so the animation starts on the same colour with no jump. This needs a native build.
- **New app icons adopted:** the package's `icon.png`, Android adaptive foreground and `favicon.png` replace the Expo defaults, with a pink (`#E6005C`) Android adaptive background, and `ios.icon` points at the new PNG instead of the Expo-template Icon Composer asset. Icons appear only in native builds, not Expo Go.
- **Design reference kept:** the original package moves to `docs/design/fourth-splash/` and `docs/Fourth loading animation.html` stays in `docs/`.
- **Reanimated added** as a direct dependency (`expo install`); it runs the animation on the UI thread while the app boots.
- **Fix to the supplied code:** its `TOTAL_MS` (2500) ends before the wordmark animation (2200 to 2700), so "fourth." would never reach full opacity. The timeline is set to 2700 ms and a test pins the final frame.
- **Out of scope:**
  - the rebrand of the "Ralligo" `Logo` atom, the Home wordmark and the app display name (`app.json` `name` is `padel-ralligo`, the label under the home screen icon), tracked in issue #40: until it is done the launch screen and icon say Fourth while the rest of the app and the icon label say Ralligo;
  - changing `slug`, `scheme`, `bundleIdentifier`, or the package's `app.json.example` name and slug (also #40);
  - the Android monochrome (themed) icon, which stays the Expo template silhouette until a monochrome version of the mark exists;
  - a shared in-app loading component or skeletons (stay in #39);
  - Lottie or Rive;
  - changing session or profile loading logic.

## Capabilities

### New Capabilities

- `launch-screen`: what members see from cold start until the app is ready, including the first-launch intro, the short version, reduced motion and accessibility.

### Modified Capabilities

None. The existing `guest-access` requirement ("only a loading indicator is shown" while the session loads) is satisfied by the launch screen, so it does not change.

## Impact

- `apps/mobile`: icon files in `assets/images/` (`icon.png`, `android-icon-foreground.png`, `favicon.png` replaced; `android-icon-background.png` and the `assets/expo.icon` Icon Composer asset no longer used), `app.json` icon settings, new `src/splash/` (timeline helpers, `FourthMark`, `AnimatedSplash`, intro-seen storage, `LaunchSplash`), `AppShell` renders it, `_layout.tsx` stops hiding the native splash itself, `app.json` splash plugin settings, one transparent PNG in `assets/images/`. The supplied package moves to `docs/design/fourth-splash/`.
- Dependencies: `react-native-reanimated` (and `react-native-worklets`, already present only through `@expo/ui`) as direct dependencies of `apps/mobile`.
- Tests: Reanimated jest setup, pure timeline and decision tests, overlay sequencing with fake timers, an `AppShell` integration test.
- No database or API changes.
