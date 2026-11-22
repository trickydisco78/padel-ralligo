import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Only a flag is stored, never anything about the member. SecureStore is the one on-device store the app
// already ships; it only exists on iOS and Android.
const KEY = 'launch.introSeen';

const isNative = () => Platform.OS === 'ios' || Platform.OS === 'android';

/** Whether the first-launch intro has been seen: `null` when it cannot be read, so launch is never blocked. */
export async function readIntroSeen(): Promise<boolean | null> {
  if (!isNative()) return null;
  try {
    return (await SecureStore.getItemAsync(KEY)) !== null;
  } catch {
    return null;
  }
}

/** Records that the intro has played to the end. A failed write only means the intro may play again. */
export async function markIntroSeen(): Promise<void> {
  if (!isNative()) return;
  try {
    await SecureStore.setItemAsync(KEY, '1');
  } catch {
    // Ignore: the worst case is seeing the full intro once more.
  }
}

/** Clears the flag so the next launch plays the full intro again. For the developer tools only. */
export async function resetIntroSeen(): Promise<void> {
  if (!isNative()) return;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Ignore: the intro just stays seen.
  }
}
