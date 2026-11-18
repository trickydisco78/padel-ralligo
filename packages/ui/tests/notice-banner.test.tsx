import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { NoticeBanner } from '../src/components/notice-banner';
import { Colors } from '../src/theme/tokens';

describe('NoticeBanner', () => {
  it('reads out as one plain text element', async () => {
    await render(<NoticeBanner>Trip dates stay private.</NoticeBanner>);
    expect(screen.getByLabelText('Trip dates stay private.')).toBeOnTheScreen();
    expect(screen.getByText('Trip dates stay private.')).toBeOnTheScreen();
  });

  it('uses the light green tint', async () => {
    await render(<NoticeBanner>Hello</NoticeBanner>);
    expect(screen.getByLabelText('Hello')).toHaveStyle({ backgroundColor: Colors.light.primaryTint });
  });

  it('shows an icon but hides it from assistive technology', async () => {
    await render(<NoticeBanner icon={<Text testID="icon">i</Text>}>Hello</NoticeBanner>);
    expect(screen.getByTestId('icon', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('icon')).toBeNull();
  });
});
