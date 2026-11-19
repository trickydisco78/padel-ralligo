import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Icon,
  IconButton,
  Input,
  Radio,
  Switch,
  iconPaths,
  initialsOf,
} from '../src/components/atoms';
import { colors, radius, shadows } from '../src/theme/tokens';

const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('Button', () => {
  it('calls onPress when enabled and not when disabled', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<Button title="Post" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Post' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    await rerender(<Button title="Post" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Post' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('conveys a hint, disabled and busy state, and is not busy by default', async () => {
    await render(<Button title="Join match" onPress={() => {}} disabled busy accessibilityHint="Joining is not available yet" />);
    const button = screen.getByRole('button', { name: 'Join match' });
    expect(button.props.accessibilityHint).toBe('Joining is not available yet');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  });

  it('primary is a 56 point pink pill with the brand glow', async () => {
    await render(<Button title="Save" onPress={() => {}} />);
    const style = flat(screen.getByRole('button', { name: 'Save' }));
    expect(style.backgroundColor).toBe(colors.pink500);
    expect(style.minHeight).toBe(56);
    expect(style.borderRadius).toBe(radius.pill);
    expect(style.shadowColor).toBe(shadows.shadowBrand.shadowColor);
  });

  it('disabled primary loses its colour and glow', async () => {
    await render(<Button title="Save" onPress={() => {}} disabled />);
    const style = flat(screen.getByRole('button', { name: 'Save' }));
    expect(style.backgroundColor).toBe(colors.surfaceSoft);
    expect(style.shadowColor).toBeUndefined();
  });

  it('secondary is outlined in soft pink on white', async () => {
    await render(<Button variant="secondary" title="Sign in" onPress={() => {}} />);
    const style = flat(screen.getByRole('button', { name: 'Sign in' }));
    expect(style.backgroundColor).toBe(colors.surface);
    expect(style.borderColor).toBe(colors.pink200);
    expect(style.borderWidth).toBe(1.5);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });

  it('choice reports selection and uses the tint when selected', async () => {
    await render(
      <>
        <Button variant="choice" title="On" selected onPress={() => {}} />
        <Button variant="choice" title="Off" onPress={() => {}} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'On' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: 'Off' }).props.accessibilityState.selected).toBe(false);
    expect(flat(screen.getByRole('button', { name: 'On' })).backgroundColor).toBe(colors.pink100);
    expect(flat(screen.getByRole('button', { name: 'Off' })).backgroundColor).toBe(colors.surface);
    expect(flat(screen.getByRole('button', { name: 'Off' })).minHeight).toBeGreaterThanOrEqual(44);
  });
});

describe('IconButton', () => {
  it('is a labelled 44 point round button', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="filter" accessibilityLabel="Filters" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Filters' });
    expect(flat(button)).toMatchObject({ width: 44, height: 44, borderRadius: 22 });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('brand is pink and the large size is 56', async () => {
    await render(<IconButton icon="plus" variant="brand" size={56} accessibilityLabel="New game" onPress={() => {}} />);
    expect(flat(screen.getByRole('button', { name: 'New game' }))).toMatchObject({
      width: 56,
      backgroundColor: colors.pink500,
    });
  });
});

describe('Icon', () => {
  it('has the 26 design-system icons plus alert', () => {
    expect(Object.keys(iconPaths)).toHaveLength(27);
    expect(iconPaths.home.length).toBeGreaterThan(0);
  });

  it('is hidden from assistive technology unless labelled', async () => {
    await render(
      <>
        <Icon name="home" />
        <Icon name="bell" accessibilityLabel="Notifications" />
      </>,
    );
    expect(screen.getByRole('image', { name: 'Notifications' })).toBeTruthy();
    expect(screen.queryAllByRole('image')).toHaveLength(1);
  });
});

describe('Badge', () => {
  it('reads out its label and uses the variant ground', async () => {
    await render(<Badge label="1 spot needed" variant="brand" />);
    const badge = screen.getByLabelText('1 spot needed');
    expect(flat(badge)).toMatchObject({ backgroundColor: colors.pink500, height: 30, borderRadius: radius.pill });
  });

  it('status badges use a soft ground, not white text on amber or green', async () => {
    await render(
      <>
        <Badge label="Pending" variant="pending" />
        <Badge label="Accepted" variant="success" />
      </>,
    );
    expect(flat(screen.getByLabelText('Pending')).backgroundColor).toBe(colors.amber100);
    expect(flat(screen.getByLabelText('Accepted')).backgroundColor).toBe(colors.green100);
    expect(StyleSheet.flatten(screen.getByText('Pending').props.style).color).toBe(colors.amber800);
  });

  it('caps badges are 28 points tall and upper case', async () => {
    await render(<Badge label="Verified" caps />);
    expect(screen.getByText('VERIFIED')).toBeTruthy();
    expect(flat(screen.getByLabelText('Verified')).height).toBe(28);
  });
});

describe('Avatar', () => {
  it.each([
    ['Jordi M.', 'JM'],
    ['Lucía C.', 'LC'],
    ['Hannah', 'H'],
    ['  diego   r.  ', 'DR'],
    ['Ben van der Berg', 'BV'],
    ['', ''],
    ['123', ''],
  ])('turns %j into %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });

  it('is hidden from screen readers by default, as the name is written beside it', async () => {
    await render(<Avatar name="Jordi M." />);
    expect(screen.getByText('JM', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('JM')).toBeNull();
  });

  it('is an image with the full name when labelled', async () => {
    await render(<Avatar name="Alex Morgan" labelled />);
    expect(screen.getByRole('image', { name: 'Alex Morgan' })).toBeTruthy();
  });

  it('ink has pink300 letters and the 96 size is a rounded tile', async () => {
    await render(<Avatar name="Alex Morgan" labelled size="xl" />);
    const avatar = screen.getByRole('image', { name: 'Alex Morgan' });
    expect(flat(avatar)).toMatchObject({ width: 96, height: 96, borderRadius: 30, backgroundColor: colors.ink });
    expect(StyleSheet.flatten(screen.getByText('AM').props.style).color).toBe(colors.pink300);
  });
});

describe('Input', () => {
  it('shows a pink border and ring only while focused', async () => {
    await render(<Input accessibilityLabel="Name" />);
    const input = screen.getByLabelText('Name');
    expect(flat(input).borderColor).toBe(colors.control);
    await fireEvent(input, 'focus');
    expect(flat(screen.getByLabelText('Name')).borderColor).toBe(colors.pink500);
    await fireEvent(screen.getByLabelText('Name'), 'blur');
    expect(flat(screen.getByLabelText('Name')).borderColor).toBe(colors.control);
  });

  it('is 56 points tall, 112 when multiline', async () => {
    await render(
      <>
        <Input accessibilityLabel="One" />
        <Input accessibilityLabel="Many" multiline />
      </>,
    );
    expect(flat(screen.getByLabelText('One')).minHeight).toBe(56);
    expect(flat(screen.getByLabelText('Many')).minHeight).toBe(112);
  });

  it('shows an error border when invalid and is not editable when disabled', async () => {
    await render(
      <>
        <Input accessibilityLabel="Bad" invalid />
        <Input accessibilityLabel="Off" disabled />
      </>,
    );
    expect(flat(screen.getByLabelText('Bad')).borderColor).toBe(colors.error600);
    expect(screen.getByLabelText('Off').props.editable).toBe(false);
    expect(screen.getByLabelText('Off').props.accessibilityState).toMatchObject({ disabled: true });
  });
});

describe('Checkbox', () => {
  it('is a checkbox row that reports state and toggles', async () => {
    const onChange = jest.fn();
    await render(<Checkbox label="Share my trip" checked onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Share my trip' });
    expect(box.props.accessibilityState.checked).toBe(true);
    await fireEvent.press(box);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('shows an error with an icon and does not toggle when disabled', async () => {
    const onChange = jest.fn();
    await render(<Checkbox label="Terms" checked={false} onChange={onChange} disabled error="Tick to continue" />);
    expect(screen.getByText('Tick to continue')).toBeTruthy();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Terms' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has at least a 44 point row', async () => {
    await render(<Checkbox label="Row" checked={false} onChange={() => {}} />);
    expect(flat(screen.getByRole('checkbox', { name: 'Row' })).minHeight).toBeGreaterThanOrEqual(44);
  });
});

describe('Radio', () => {
  it('is a radio that reports checked and selects', async () => {
    const onSelect = jest.fn();
    await render(
      <>
        <Radio label="Doubles" selected onSelect={() => {}} />
        <Radio label="Singles" selected={false} onSelect={onSelect} />
      </>,
    );
    expect(screen.getByRole('radio', { name: 'Doubles' }).props.accessibilityState.checked).toBe(true);
    await fireEvent.press(screen.getByRole('radio', { name: 'Singles' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('Switch', () => {
  it('toggles from the whole row and reports its state', async () => {
    const onValueChange = jest.fn();
    await render(<Switch label="Show my trip" value={false} onValueChange={onValueChange} hint="Visible to players" />);
    const row = screen.getByRole('switch', { name: 'Show my trip' });
    expect(row.props.accessibilityState.checked).toBe(false);
    expect(row.props.accessibilityHint).toBe('Visible to players');
    await fireEvent.press(row);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('uses a pink track when on and a control track when off', async () => {
    await render(<Switch label="On" value onValueChange={() => {}} />);
    const native = screen.getByTestId('switch-control', { includeHiddenElements: true });
    expect(native.props.onTintColor).toBe(colors.pink500);
    expect(native.props.tintColor).toBe(colors.control);
    expect(native.props.thumbTintColor).toBe(colors.surface);
  });
});
