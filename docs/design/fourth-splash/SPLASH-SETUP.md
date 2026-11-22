# Animated splash for Fourth (Expo)

What you get: a plain pink native splash, then an animated logo that plays over it. The court draws itself, three balls arrive one after another, then the fourth square fills and the wordmark rises in. It waits for your real loading to finish, then fades out.

## Files

| File | What it is |
| --- | --- |
| `FourthMark.tsx` | The logo as SVG, with every part driven by one `progress` value (0 to 1) |
| `AnimatedSplash.tsx` | The full-screen overlay: runs the intro, waits for the app, fades out |
| `App.example.tsx` | How to wire it into your root layout |
| `app.json.example` | Native splash, icon and adaptive icon settings |
| `assets/` | `icon.png` (1024), `adaptive-icon.png` (Android foreground), `splash-blank.png` (transparent), `favicon.png` |

Put the two `.tsx` files somewhere like `src/splash/` and copy `assets/` into your project's `assets/`.

## 1. Install

```sh
npx expo install react-native-reanimated react-native-worklets react-native-svg expo-splash-screen expo-font @expo-google-fonts/outfit
```

Expo's Reanimated docs say the Babel plugin is configured automatically by `babel-preset-expo`, so there is no extra Babel step. Clear the cache if you had Reanimated before: `npx expo start -c`.

## 2. Native splash: just the pink

Use the config plugin in `app.json` (see `app.json.example`). It sets the background to `#E6005C` and uses `assets/splash-blank.png`, a transparent image, so the native splash is only a pink screen. The animated one then draws the logo on the same pink, so there is no jump.

- Config plugin changes need a new native build. They don't apply in Expo Go, and development builds don't fully match the release splash. Always check on a release build.
- On Android 12 and later the system always draws a splash icon. The transparent image keeps that invisible.

## 3. Wire it into the root

See `App.example.tsx`. The order matters:

1. `SplashScreen.preventAutoHideAsync()` in global scope, so the pink native splash stays up.
2. Load fonts (Outfit 800 is needed for the wordmark). Render nothing until they are loaded.
3. Render `<AnimatedSplash ready={...} onShown={hideNative} onFinish={...} />` on top of your app.
4. `onShown` calls `SplashScreen.hideAsync()`. The native splash goes, the animated one is already there.
5. When your real loading is finished, set `ready` to true. The splash waits for the intro to finish (about 2.5 seconds), then fades out over 300 ms and calls `onFinish`. Unmount it there.

Because it waits for the intro, the shortest a user ever sees is about 2.8 seconds. If that feels long for returning users, show only the mark with `showWordmark={false}` and shorten `TOTAL_MS`, or skip the intro on later launches.

## 4. How the animation is built

One shared value, `progress`, goes from 0 to 1 over `TOTAL_MS` (2500 ms). Every piece of the logo reads it through `useAnimatedProps`, so they all stay in sync and you can change the timing in one place. Lines are drawn by animating `strokeDashoffset`.

| Time (ms) | What happens |
| --- | --- |
| 0 – 250 | A single ball pops in at the centre |
| 150 – 800 | The net and centre line draw outward from it, then the ball disappears |
| 600 – 1200 | The court outline draws |
| 1100 – 1700 | Three balls pop into the corners, one by one |
| 1700 – 2300 | The fourth square fills from its middle and its ball lands |
| 2200 – 2700 | The wordmark rises and fades in |
| After the intro | The last ball pulses gently until the app is ready |

To retime a step, change the `at(from)` and `at(to)` numbers in `FourthMark.tsx`. To use the white-square version, pass `variant="white"` to `AnimatedSplash`.

Reduced motion is respected: with "Reduce Motion" turned on, the logo appears finished and the splash just fades out.

## Other ways to do it

- **Lottie** if a motion designer builds the animation in After Effects. You get more freedom but need an extra library and a JSON file to maintain.
- **Rive** for interactive vector animation with a design tool of its own.
- The Reanimated version here has no extra assets, stays crisp at any size, and is easy to retime in code.

## Not tested

I haven't run this in an Expo project. Check it on both platforms on a release build, and check the types against your versions of Reanimated and React Native.
