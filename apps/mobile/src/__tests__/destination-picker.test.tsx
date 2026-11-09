import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { DestinationPicker } from '@/components/destination-picker';
import { mockState, resetMockSupabase } from '@/test/mock-supabase';

jest.mock('@/lib/supabase', () => jest.requireActual('@/test/mock-supabase'));

const row = (id: string, name: string, open_listings: number) => ({
  id,
  name,
  country: 'Spain',
  tagline: '',
  open_listings,
});

beforeEach(() => {
  resetMockSupabase();
  mockState.destinations = [
    row('m', 'Marbella', 3),
    row('b', 'Barcelona', 1),
    row('t', 'Tenerife', 0),
  ];
});

describe('DestinationPicker', () => {
  it('lists destinations alphabetically with open-listing counts', async () => {
    await render(<DestinationPicker value={null} onChange={() => {}} />);

    await waitFor(() => expect(screen.getByText('Barcelona')).toBeTruthy());
    const names = screen.getAllByRole('button').map((b) => b.props.accessibilityLabel);
    expect(names).toEqual(['Barcelona', 'Marbella', 'Tenerife']);
    expect(screen.getByText('3 games')).toBeTruthy();
    expect(screen.getByText('1 game')).toBeTruthy();
    expect(screen.getByText('0 games')).toBeTruthy();
  });

  it('reports the chosen destination and marks it selected', async () => {
    const onChange = jest.fn();
    await render(<DestinationPicker value="m" onChange={onChange} />);
    await waitFor(() => expect(screen.getByText('Marbella')).toBeTruthy());

    expect(screen.getByRole('button', { name: 'Marbella' }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Tenerife' }));
    expect(onChange).toHaveBeenCalledWith('t');
  });

  it('clears the selection when allowed and the selected destination is pressed again', async () => {
    const onChange = jest.fn();
    await render(<DestinationPicker value="m" onChange={onChange} allowClear />);
    await waitFor(() => expect(screen.getByText('Marbella')).toBeTruthy());

    await fireEvent.press(screen.getByRole('button', { name: 'Marbella' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows an error if destinations cannot be loaded', async () => {
    mockState.destinationsError = { message: 'down' };
    await render(<DestinationPicker value={null} onChange={() => {}} />);
    await waitFor(() => expect(screen.getByText('Could not load destinations.')).toBeTruthy());
  });
});
