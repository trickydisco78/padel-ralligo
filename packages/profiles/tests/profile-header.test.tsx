import { render, screen } from '@testing-library/react-native';

import { ProfileHeader } from '../src/presentation/components/profile-header';

describe('ProfileHeader', () => {
  it('shows the name as a header with the place, badge and tags', async () => {
    await render(<ProfileHeader name="Alex Morgan" location="Málaga" badge="Verified" tags={['Padel', 'Here until Jun 21']} />);
    expect(screen.getByRole('header', { name: 'Alex Morgan' })).toBeOnTheScreen();
    expect(screen.getByText('Málaga')).toBeOnTheScreen();
    expect(screen.getByText('PLAYER CARD')).toBeOnTheScreen();
    expect(screen.getByText('VERIFIED')).toBeOnTheScreen();
    expect(screen.getByText('PADEL')).toBeOnTheScreen();
    expect(screen.getByText('HERE UNTIL JUN 21')).toBeOnTheScreen();
  });

  it('reads each stat as one element and shows at most three', async () => {
    await render(
      <ProfileHeader
        name="Alex Morgan"
        stats={[
          { value: '4.0', label: 'Level' },
          { value: '18', label: 'Matches' },
          { value: '7', label: 'Friends' },
          { value: '99', label: 'Extra' },
        ]}
      />,
    );
    expect(screen.getByLabelText('Level: 4.0')).toBeOnTheScreen();
    expect(screen.getByLabelText('Matches: 18')).toBeOnTheScreen();
    expect(screen.getByLabelText('Friends: 7')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Extra: 99')).toBeNull();
  });

  it('has no stats card without stats', async () => {
    await render(<ProfileHeader name="Alex Morgan" />);
    expect(screen.queryByLabelText('Player stats')).toBeNull();
  });

  it('hides the avatar initials from assistive technology, as the name is beside it', async () => {
    await render(<ProfileHeader name="Alex Morgan" />);
    expect(screen.queryByText('AM')).toBeNull();
    expect(screen.getByText('AM', { includeHiddenElements: true })).toBeTruthy();
  });
});
