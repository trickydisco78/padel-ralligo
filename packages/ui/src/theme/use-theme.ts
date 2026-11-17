import { Colors } from './tokens';

/** Light theme only for v1, so the hook is a thin accessor kept for a future dark mode. */
export function useTheme() {
  return Colors.light;
}
