import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BookingBar } from '../src/presentation/components/booking-bar';
import { SlotPicker } from '../src/presentation/components/slot-picker';

const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;
const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

const dates = [
  { value: '2026-06-14', weekday: 'Sun', day: '14' },
  { value: '2026-06-15', weekday: 'Mon', day: '15' },
];
const slots = [
  { time: '18:00', available: true },
  { time: '19:30', available: false },
  { time: '21:00', available: true },
  { time: '22:30', available: true },
];

const picker = (over: Partial<React.ComponentProps<typeof SlotPicker>> = {}) => (
  <SlotPicker
    dates={dates}
    slots={slots}
    selectedDate="2026-06-14"
    selectedTime={null}
    onSelectDate={() => {}}
    onSelectTime={() => {}}
    {...over}
  />
);

describe('SlotPicker', () => {
  it('has a Date and a Start time heading', async () => {
    await render(picker());
    expect(screen.getByRole('header', { name: 'Date' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Start time' })).toBeOnTheScreen();
  });

  it('marks the chosen date and reports a new one', async () => {
    const onSelectDate = jest.fn();
    await render(picker({ onSelectDate }));
    expect(screen.getByRole('button', { name: 'Sun 14', selected: true })).toBeTruthy();
    expect(flat(screen.getByRole('button', { name: 'Sun 14' })).backgroundColor).toBe('#E6005C');
    await fireEvent.press(screen.getByRole('button', { name: 'Mon 15' }));
    expect(onSelectDate).toHaveBeenCalledWith('2026-06-15');
  });

  it('shows every time, in 24-hour form, and reports a chosen one', async () => {
    const onSelectTime = jest.fn();
    await render(picker({ onSelectTime, selectedTime: '21:00' }));
    for (const slot of slots) expect(screen.getByText(slot.time)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '21:00', selected: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: '18:00' }));
    expect(onSelectTime).toHaveBeenCalledWith('18:00');
  });

  it('keeps a taken time in the grid, disabled and struck through', async () => {
    const onSelectTime = jest.fn();
    await render(picker({ onSelectTime }));
    const taken = screen.getByRole('button', { name: '19:30' });
    expect(taken.props.accessibilityState).toMatchObject({ disabled: true, selected: false });
    expect(taken.props.accessibilityHint).toBe('Taken');
    expect(StyleSheet.flatten(screen.getByText('19:30').props.style).textDecorationLine).toBe('line-through');
    await fireEvent.press(taken);
    expect(onSelectTime).not.toHaveBeenCalled();
  });

  it('lays times out three to a row, padding the last row', async () => {
    await render(picker());
    // 4 slots: one full row of 3 and a row of 1 plus two spacers, so all cells keep the same width.
    const first = screen.getByRole('button', { name: '18:00' });
    const last = screen.getByRole('button', { name: '22:30' });
    expect(first.parent).not.toBe(last.parent);
    expect(first.parent!.children).toHaveLength(3);
    expect(last.parent!.children).toHaveLength(3);
  });
});

describe('BookingBar', () => {
  const bar = (over: Partial<React.ComponentProps<typeof BookingBar>> = {}) =>
    render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BookingBar price="€36" split="€9 each when split by 4" actionLabel="Reserve" onAction={() => {}} {...over} />
      </SafeAreaProvider>,
    );

  it('shows the price, the split and one primary action', async () => {
    const onAction = jest.fn();
    await bar({ onAction });
    expect(screen.getByText('€36')).toBeOnTheScreen();
    expect(screen.getByText('€9 each when split by 4')).toBeOnTheScreen();
    expect(screen.getByLabelText('€36 total, €9 each when split by 4')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Reserve' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows a dash and a disabled action until a date and time are chosen', async () => {
    const onAction = jest.fn();
    await bar({ price: null, split: undefined, actionDisabled: true, onAction });
    expect(screen.getByText('—')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Reserve' }));
    expect(onAction).not.toHaveBeenCalled();
  });

  it('clears the home indicator', async () => {
    await bar();
    let node = screen.getByText('€36').parent;
    let found = false;
    while (node) {
      const paddingBottom = StyleSheet.flatten(node.props.style as never)?.paddingBottom;
      if (typeof paddingBottom === 'number') {
        found = paddingBottom >= 34;
        break;
      }
      node = node.parent;
    }
    expect(found).toBe(true);
  });
});
