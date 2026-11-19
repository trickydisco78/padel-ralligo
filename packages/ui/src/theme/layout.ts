import { Platform } from 'react-native';

/** Layout constants that are not design-system tokens. */
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
