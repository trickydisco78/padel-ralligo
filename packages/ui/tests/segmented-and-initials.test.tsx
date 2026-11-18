import { fireEvent, render, screen } from '@testing-library/react-native';

import { InitialsTile, initialsOf, tileColorFor } from '../src/components/initials-tile';
import { SegmentedControl } from '../src/components/segmented-control';
import { TileColors } from '../src/theme/tokens';

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

  it('shows the counts', async () => {
    await render(<SegmentedControl options={options} value="players" onChange={() => {}} />);
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('reports the chosen value', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={options} value="players" onChange={onChange} />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Open matches, 2' }));
    expect(onChange).toHaveBeenCalledWith('matches');
  });

  it('works without counts', async () => {
    await render(
      <SegmentedControl options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} value="a" onChange={() => {}} />,
    );
    expect(screen.getByRole('tab', { name: 'A', selected: true })).toBeTruthy();
  });
});

describe('initialsOf', () => {
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
});

describe('tileColorFor', () => {
  it('gives the same name the same colour from the palette', () => {
    expect(tileColorFor('Jordi M.')).toBe(tileColorFor('Jordi M.'));
    expect(TileColors).toContain(tileColorFor('Jordi M.'));
  });

  it('uses more than one colour across different names', () => {
    const colours = new Set(['Jordi M.', 'Hannah K.', 'Lucía C.', 'Diego R.', 'Sam T.', 'Ana P.'].map(tileColorFor));
    expect(colours.size).toBeGreaterThan(1);
  });
});

describe('InitialsTile', () => {
  it('shows the initials and is hidden from screen readers', async () => {
    await render(<InitialsTile name="Jordi M." />);
    expect(screen.getByText('JM', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('JM')).toBeNull();
  });
});
