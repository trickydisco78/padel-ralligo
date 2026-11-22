import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import type { Profile } from '../src/domain/profile';
import { HERO_AVATAR_OVERLAP, ProfileView } from '../src/presentation/components/profile-view';

const profile: Profile = {
  displayName: 'Alex Morgan',
  homeCity: 'Málaga',
  bio: 'Friendly doubles after work.',
  skillTier: 'Intermediate',
  homeDestinationId: null,
  discoverableAt: null,
};

describe('ProfileView', () => {
  it('shows the initials avatar, the name as a heading and the tier and city on one line', async () => {
    await render(<ProfileView profile={profile} onEdit={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Alex Morgan' })).toBeOnTheScreen();
    expect(screen.getByText('AM', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByText('Intermediate · Málaga')).toBeOnTheScreen();
    expect(screen.getByText('Friendly doubles after work.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Display name')).toBeNull();
  });

  it('shows the skill tier on a level card captioned Your level', async () => {
    await render(<ProfileView profile={profile} onEdit={jest.fn()} />);
    expect(screen.getByText('Your level')).toBeOnTheScreen();
    expect(screen.getByText('Intermediate')).toBeOnTheScreen();
  });

  it('leaves out a missing home city, bio and level card without placeholders', async () => {
    await render(<ProfileView profile={{ ...profile, homeCity: '', bio: '', skillTier: null }} onEdit={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Alex Morgan' })).toBeOnTheScreen();
    expect(screen.queryByText(/·/)).toBeNull();
    expect(screen.queryByText('Your level')).toBeNull();
    expect(screen.queryByText('About')).toBeNull();
  });

  it('shows only the city on the line when there is no skill tier', async () => {
    await render(<ProfileView profile={{ ...profile, skillTier: null }} onEdit={jest.fn()} />);
    expect(screen.getByText('Málaga')).toBeOnTheScreen();
    expect(screen.queryByText('Your level')).toBeNull();
  });

  it('shows the About section with the bio', async () => {
    await render(<ProfileView profile={profile} onEdit={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'About' })).toBeOnTheScreen();
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

  it('lets a long name wrap, and starts it below the avatar, so large text never hides it', async () => {
    await render(<ProfileView profile={{ ...profile, displayName: 'Alexandra Montgomery-Featherstonehaugh' }} onEdit={jest.fn()} />);
    const name = screen.getByRole('header', { name: 'Alexandra Montgomery-Featherstonehaugh' });
    expect(name.props.numberOfLines).toBeUndefined();
    const style = StyleSheet.flatten(name.props.style) as { height?: number; maxHeight?: number };
    expect(style.height).toBeUndefined();
    expect(style.maxHeight).toBeUndefined();
    const sheet = screen.getByTestId('profile-sheet');
    expect((StyleSheet.flatten(sheet.props.style) as { paddingTop: number }).paddingTop).toBeGreaterThanOrEqual(HERO_AVATAR_OVERLAP);
  });
});
