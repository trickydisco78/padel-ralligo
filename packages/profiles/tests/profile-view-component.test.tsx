import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Profile } from '../src/domain/profile';
import { ProfileView } from '../src/presentation/components/profile-view';

const profile: Profile = {
  displayName: 'Alex Morgan',
  homeCity: 'Málaga',
  bio: 'Friendly doubles after work.',
  skillTier: 'Intermediate',
  homeDestinationId: null,
  discoverableAt: null,
};

describe('ProfileView', () => {
  it('shows the name, skill tier, home place and bio as text, not as fields', async () => {
    await render(<ProfileView profile={profile} onEdit={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Alex Morgan' })).toBeOnTheScreen();
    expect(screen.getByText('INTERMEDIATE')).toBeOnTheScreen();
    expect(screen.getByText('Málaga')).toBeOnTheScreen();
    expect(screen.getByText('Friendly doubles after work.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Display name')).toBeNull();
  });

  it('leaves out an empty bio and home place', async () => {
    await render(<ProfileView profile={{ ...profile, homeCity: '', bio: '' }} onEdit={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Alex Morgan' })).toBeOnTheScreen();
    expect(screen.queryByText('Málaga')).toBeNull();
    expect(screen.queryByText('About')).toBeNull();
  });

  it('shows only the name when there is no skill tier yet', async () => {
    await render(<ProfileView profile={{ ...profile, skillTier: null }} onEdit={jest.fn()} />);
    expect(screen.queryByText('INTERMEDIATE')).toBeNull();
  });

  it('asks to edit with the Edit profile button', async () => {
    const onEdit = jest.fn();
    await render(<ProfileView profile={profile} onEdit={onEdit} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Edit profile' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('offers to add a bio when there is none, opening the editor', async () => {
    const onEdit = jest.fn();
    await render(<ProfileView profile={{ ...profile, bio: '' }} onEdit={onEdit} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Add a bio' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('does not offer to add a bio when there is one', async () => {
    await render(<ProfileView profile={profile} onEdit={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Add a bio' })).toBeNull();
  });
});
