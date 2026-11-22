import { fireEvent, render, screen } from '@testing-library/react-native';

import { resetIntroSeen } from '@/splash/intro-seen';

import { DevTools, devToolsEnabled } from './dev-tools';

jest.mock('@/splash/intro-seen', () => ({
  readIntroSeen: jest.fn(async () => true),
  markIntroSeen: jest.fn(async () => {}),
  resetIntroSeen: jest.fn(async () => {}),
}));

const reset = resetIntroSeen as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('devToolsEnabled', () => {
  const env = process.env.EXPO_PUBLIC_DEV_TOOLS;
  afterEach(() => {
    if (env === undefined) delete process.env.EXPO_PUBLIC_DEV_TOOLS;
    else process.env.EXPO_PUBLIC_DEV_TOOLS = env;
  });

  it('is on in a development build', () => {
    expect(devToolsEnabled({ dev: true, flag: undefined })).toBe(true);
  });

  it('is off in a release build unless the build flag is true', () => {
    expect(devToolsEnabled({ dev: false, flag: undefined })).toBe(false);
    expect(devToolsEnabled({ dev: false, flag: 'false' })).toBe(false);
    expect(devToolsEnabled({ dev: false, flag: 'true' })).toBe(true);
  });
});

describe('DevTools', () => {
  it('renders nothing when disabled', async () => {
    await render(<DevTools enabled={false} />);
    expect(screen.queryByRole('button', { name: 'Replay launch intro' })).toBeNull();
    expect(screen.queryByText('Developer')).toBeNull();
  });

  it('clears the seen flag and says what to do next', async () => {
    await render(<DevTools enabled />);
    expect(screen.queryByText(/Close the app/)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Replay launch intro' }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Close the app and open it again/)).toBeOnTheScreen();
  });
});
