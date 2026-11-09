import { ActivityIndicator, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useDestinations } from '@/data/use-destinations';

type Props = {
  value: string | null;
  onChange: (destinationId: string | null) => void;
  /** Lets the user clear the selection, e.g. for a filter. */
  allowClear?: boolean;
  error?: string;
};

export function DestinationPicker({ value, onChange, allowClear = false, error }: Props) {
  const { destinations, loading, failed } = useDestinations();

  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="smallBold">Destination</ThemedText>
      {loading ? <ActivityIndicator color={Colors.light.primary} /> : null}
      {failed ? (
        <ThemedText type="small" style={{ color: '#C62828' }}>
          Could not load destinations.
        </ThemedText>
      ) : null}
      <View style={{ gap: Spacing.two }}>
        {destinations?.map((d) => {
          const selected = d.id === value;
          return (
            <Pressable
              key={d.id}
              accessibilityRole="button"
              accessibilityLabel={d.name}
              accessibilityState={{ selected }}
              onPress={() => onChange(allowClear && selected ? null : d.id)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: Spacing.three,
                borderRadius: Radius.button,
                borderWidth: 1,
                borderColor: selected ? Colors.light.primary : Colors.light.border,
                backgroundColor: selected ? Colors.light.primaryTint : Colors.light.backgroundElement,
              }}>
              <View>
                <ThemedText type="smallBold">{d.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {d.country}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {d.openListings} {d.openListings === 1 ? 'game' : 'games'}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: '#C62828' }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
