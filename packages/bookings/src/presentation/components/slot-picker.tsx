import { useTranslation } from '@padel/i18n';
import { borderWidth, colors, fontFamily, radius, spacing, ThemedText } from '@padel/ui';
import { Pressable, Text, View } from 'react-native';

export type SlotDate = {
  /** Identifies the day, e.g. "2026-06-14". */
  value: string;
  /** Short weekday above the date, already formatted: "Thu". */
  weekday: string;
  /** The day of the month, already formatted: "14". */
  day: string;
};

export type Slot = {
  /** 24-hour start time: "19:30". */
  time: string;
  /** A taken time stays in the grid, disabled and struck through, so the grid does not jump between days. */
  available: boolean;
};

type Props = {
  dates: readonly SlotDate[];
  slots: readonly Slot[];
  selectedDate: string | null;
  selectedTime: string | null;
  onSelectDate: (value: string) => void;
  onSelectTime: (time: string) => void;
};

const COLUMNS = 3;
const GAP = 10;

/** A date strip and a three-column grid of start times for booking a court. One choice in each group. */
export function SlotPicker({ dates, slots, selectedDate, selectedTime, onSelectDate, onSelectTime }: Props) {
  const { t } = useTranslation('bookings');

  const rows: (Slot | null)[][] = [];
  for (let i = 0; i < slots.length; i += COLUMNS) {
    const row: (Slot | null)[] = slots.slice(i, i + COLUMNS);
    while (row.length < COLUMNS) row.push(null);
    rows.push(row);
  }

  return (
    <View style={{ gap: spacing.space5 }}>
      <View style={{ gap: spacing.space3 }}>
        <ThemedText type="section" accessibilityRole="header">
          {t('slotPicker.dateHeading')}
        </ThemedText>
        <View accessibilityLabel={t('slotPicker.dateHeading')} style={{ flexDirection: 'row', gap: spacing.space2 }}>
          {dates.map((date) => {
            const selected = date.value === selectedDate;
            return (
              <Pressable
                key={date.value}
                accessibilityRole="button"
                accessibilityLabel={`${date.weekday} ${date.day}`}
                accessibilityState={{ selected }}
                onPress={() => onSelectDate(date.value)}
                style={{
                  flex: 1,
                  minHeight: 68,
                  borderRadius: radius.md,
                  borderWidth,
                  borderColor: selected ? colors.pink500 : colors.lineStrong,
                  backgroundColor: selected ? colors.pink500 : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ color: selected ? colors.surface : colors.muted, fontFamily: fontFamily[600], fontSize: 12, lineHeight: 16 }}>
                  {date.weekday}
                </Text>
                <Text style={{ color: selected ? colors.surface : colors.ink, fontFamily: fontFamily[700], fontSize: 19, lineHeight: 24 }}>
                  {date.day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: spacing.space3 }}>
        <ThemedText type="section" accessibilityRole="header">
          {t('slotPicker.timeHeading')}
        </ThemedText>
        <View accessibilityLabel={t('slotPicker.timeHeading')} style={{ gap: GAP }}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row', gap: GAP }}>
              {row.map((slot, columnIndex) => {
                if (!slot) return <View key={`empty-${columnIndex}`} style={{ flex: 1 }} />;
                const selected = slot.time === selectedTime;
                const taken = !slot.available;
                return (
                  <Pressable
                    key={slot.time}
                    accessibilityRole="button"
                    accessibilityLabel={slot.time}
                    accessibilityHint={taken ? t('slotPicker.taken') : undefined}
                    accessibilityState={{ selected, disabled: taken }}
                    disabled={taken}
                    onPress={() => onSelectTime(slot.time)}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: radius.pill,
                      borderWidth,
                      borderColor: taken ? colors.surfaceSoft : selected ? colors.pink500 : colors.lineStrong,
                      backgroundColor: taken ? colors.surfaceSoft : selected ? colors.pink500 : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        color: taken ? colors.muted : selected ? colors.surface : colors.ink,
                        fontFamily: selected ? fontFamily[700] : fontFamily[600],
                        fontSize: 16,
                        lineHeight: 22,
                        textDecorationLine: taken ? 'line-through' : 'none',
                      }}>
                      {slot.time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
