import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ThemedText } from './themed-text';
import { Colors, Radius, Spacing } from '../theme/tokens';

type Props = {
  /** Decorative; hidden from assistive technology. */
  icon?: ReactNode;
  children: string;
};

/** A light-green bar with a short notice. Read out as plain text. */
export function NoticeBanner({ icon, children }: Props) {
  return (
    <View
      accessible
      accessibilityLabel={children}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        backgroundColor: Colors.light.primaryTint,
        borderRadius: Radius.card,
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.three,
      }}>
      {icon === undefined || icon === null ? null : <View importantForAccessibility="no-hide-descendants">{icon}</View>}
      <ThemedText type="small" themeColor="primaryDark" style={{ flex: 1 }}>
        {children}
      </ThemedText>
    </View>
  );
}
