import { View } from 'react-native';

import { spacing } from '../../theme/tokens';
import { ThemedText } from './themed-text';
import { Icon } from './icon';

type Props = {
  children: string;
  /** An error is red, has an alert icon and is announced. Colour is never the only signal. */
  error?: boolean;
  /** Shown on the right, e.g. a character count. */
  count?: string;
  /** Lets a field point its input at this text. */
  nativeID?: string;
};

/** The line under a field: what to type (muted) or what went wrong (error). */
export function HelperText({ children, error = false, count, nativeID }: Props) {
  return (
    <View
      nativeID={nativeID}
      accessibilityLiveRegion={error ? 'polite' : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.space1 + 2 }}>
      {error ? <Icon name="alert" color="error600" size={16} /> : null}
      <ThemedText type="caption" themeColor={error ? 'error600' : 'muted'} style={{ flex: 1 }}>
        {children}
      </ThemedText>
      {count ? (
        <ThemedText type="caption" themeColor="muted">
          {count}
        </ThemedText>
      ) : null}
    </View>
  );
}
