import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { Badge } from '../src/components/atoms';
import { Banner, Card, DateField, FeatureCard, FormField, SearchField, SegmentedControl } from '../src/components/molecules';
import { colors } from '../src/theme/tokens';

const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('FormField', () => {
  it('shows the label above the input and wires them together', async () => {
    await render(<FormField label="Display name" helper="Shown on your player card" />);
    expect(screen.getByText('Display name')).toBeTruthy();
    expect(screen.getByLabelText('Display name').props.accessibilityHint).toBe('Shown on your player card');
    expect(screen.getByText('Shown on your player card')).toBeTruthy();
  });

  it('marks optional fields with "Optional" and never uses an asterisk', async () => {
    await render(
      <>
        <FormField label="Bio" optional />
        <FormField label="Name" />
      </>,
    );
    expect(screen.getAllByText('Optional')).toHaveLength(1);
    expect(screen.queryByText(/\*/)).toBeNull();
  });

  it('replaces the helper with the error and flags the input invalid', async () => {
    await render(<FormField label="Username" helper="Letters only" error="That username is taken. Try alex.morgan2" />);
    expect(screen.queryByText('Letters only')).toBeNull();
    expect(screen.getByText('That username is taken. Try alex.morgan2')).toBeTruthy();
    expect(flat(screen.getByLabelText('Username')).borderColor).toBe(colors.error600);
  });

  it('passes input props through and reports typing', async () => {
    const onChangeText = jest.fn();
    await render(<FormField label="Email" onChangeText={onChangeText} keyboardType="email-address" />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.co');
    expect(onChangeText).toHaveBeenCalledWith('a@b.co');
    expect(screen.getByLabelText('Email').props.keyboardType).toBe('email-address');
  });
});

describe('SearchField', () => {
  it('is a pill and shows the clear button only when there is text', async () => {
    const onChangeText = jest.fn();
    const { rerender } = await render(
      <SearchField value="" onChangeText={onChangeText} placeholder="Search courts or area" accessibilityLabel="Search" />,
    );
    expect(flat(screen.getByLabelText('Search')).borderRadius).toBe(999);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    await rerender(<SearchField value="Mál" onChangeText={onChangeText} placeholder="Search courts or area" accessibilityLabel="Search" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChangeText).toHaveBeenCalledWith('');
  });
});

describe('Card', () => {
  it('renders its children on white with a 1.5 hairline', async () => {
    await render(
      <Card testID="card">
        <Badge label="Inside" />
      </Card>,
    );
    expect(screen.getByLabelText('Inside')).toBeTruthy();
    expect(flat(screen.getByTestId('card'))).toMatchObject({ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line });
  });

  it('soft cards drop the border and take the card shadow', async () => {
    await render(<Card testID="soft" variant="soft" />);
    const style = flat(screen.getByTestId('soft'));
    expect(style.backgroundColor).toBe(colors.surfaceSoft);
    expect(style.borderWidth).toBe(0);
    expect(style.shadowOpacity).toBe(0.05);
  });
});

describe('FeatureCard', () => {
  it('is pink, clips its circles, and hides them from assistive technology', async () => {
    await render(
      <FeatureCard testID="feature">
        <Text>Level 3.5</Text>
      </FeatureCard>,
    );
    expect(flat(screen.getByTestId('feature'))).toMatchObject({ backgroundColor: colors.pink500, overflow: 'hidden' });
    expect(screen.getByText('Level 3.5')).toBeTruthy();
  });
});

describe('Banner', () => {
  it('reads out as one plain text element', async () => {
    await render(<Banner>Trip dates stay private.</Banner>);
    expect(screen.getByLabelText('Trip dates stay private.')).toBeOnTheScreen();
    expect(screen.getByText('Trip dates stay private.')).toBeOnTheScreen();
  });

  it('includes the bold title in what is read out', async () => {
    await render(
      <Banner variant="pending" title="Request sent">
        Waiting for Carlos M. to confirm
      </Banner>,
    );
    expect(screen.getByLabelText('Request sent. Waiting for Carlos M. to confirm')).toBeTruthy();
  });

  it.each([
    ['info', colors.pink100],
    ['pending', colors.amber100],
    ['success', colors.green100],
    ['declined', colors.ink],
    ['error', colors.error100],
  ] as const)('%s uses its own ground', async (variant, background) => {
    await render(<Banner variant={variant}>Hello</Banner>);
    expect(screen.getByLabelText('Hello')).toHaveStyle({ backgroundColor: background });
  });
});

const options = [
  { value: 'players', label: 'Players', count: 4 },
  { value: 'matches', label: 'Open matches', count: 2 },
] as const;

describe('SegmentedControl', () => {
  it('marks the selected option and reads out label and count', async () => {
    await render(<SegmentedControl options={options} value="players" onChange={() => {}} accessibilityLabel="Discover" />);
    expect(screen.getByLabelText('Discover')).toHaveProp('accessibilityRole', 'tablist');
    expect(screen.getByRole('tab', { name: 'Players, 4', selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Open matches, 2', selected: false })).toBeTruthy();
  });

  it('draws separate choice pills, not a joined track', async () => {
    await render(<SegmentedControl options={options} value="players" onChange={() => {}} />);
    expect(flat(screen.getByRole('tab', { name: 'Players, 4' }))).toMatchObject({ backgroundColor: colors.pink100, borderRadius: 999 });
    expect(flat(screen.getByRole('tab', { name: 'Open matches, 2' }))).toMatchObject({ backgroundColor: colors.surface, borderRadius: 999 });
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('reports the chosen value', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={options} value="players" onChange={onChange} />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Open matches, 2' }));
    expect(onChange).toHaveBeenCalledWith('matches');
  });

  it('draws the icon before the label without changing the accessible name', async () => {
    const withIcon = [
      { value: 'a', label: 'A', icon: <Text testID="icon-a">*</Text> },
      { value: 'b', label: 'B' },
    ] as const;
    await render(<SegmentedControl options={withIcon} value="a" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'A', selected: true })).toBeTruthy();
    expect(screen.getByTestId('icon-a', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('icon-a')).toBeNull();
  });
});

describe('DateField', () => {
  it('reports a date only once the text is a real calendar date', async () => {
    const onChange = jest.fn();
    await render(<DateField label="Start" value={null} onChange={onChange} />);
    await fireEvent.changeText(screen.getByLabelText('Start'), '2026-06-14');
    expect(onChange).toHaveBeenLastCalledWith('2026-06-14');
    await fireEvent.changeText(screen.getByLabelText('Start'), '14/06');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText('Use the format YYYY-MM-DD')).toBeTruthy();
  });
});
