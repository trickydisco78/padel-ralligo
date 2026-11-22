import { QueryTestProvider } from '@padel/query/testing';
import { fakeSession, mockState, resetMockSupabase, supabase } from '@padel/supabase/testing';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { markIntroSeen, readIntroSeen } from '@/splash/intro-seen';

jest.mock('@padel/supabase', () => jest.requireActual('@padel/supabase/testing'));
jest.mock('react-native-svg', () => ({ __esModule: true, default: 'Svg', Circle: 'Circle', Rect: 'Rect', Path: 'Path' }));
jest.mock('expo-splash-screen', () => ({ hide: jest.fn(), hideAsync: jest.fn(), preventAutoHideAsync: jest.fn() }));
jest.mock('@/splash/intro-seen', () => ({ readIntroSeen: jest.fn(), markIntroSeen: jest.fn() }));

const LABEL = 'Fourth, loading';
const FULL_INTRO_MS = 2700 + 1500; // animation + read hold
const FADE_MS = 320;

const routes = {
  _layout: () => (
    <QueryTestProvider>
      <AppShell />
    </QueryTestProvider>
  ),
  '(tabs)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(tabs)/index': () => <Text>Home screen</Text>,
};

const read = readIntroSeen as jest.MockedFunction<typeof readIntroSeen>;
const mark = markIntroSeen as jest.MockedFunction<typeof markIntroSeen>;
const hide = SplashScreen.hide as jest.MockedFunction<typeof SplashScreen.hide>;
const setReducedMotion = (value: boolean) =>
  (jest.requireMock('react-native-reanimated') as { __setReducedMotion: (v: boolean) => void }).__setReducedMotion(value);

async function open() {
  await renderRouter(routes, { initialUrl: '/' });
}

// `renderRouter` installs Jest's fake timers, so time is advanced rather than waited for.
async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

// Lets the seen-flag read settle.
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

const layout = () => fireEvent(screen.getByLabelText(LABEL), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } } });

beforeEach(() => {
  resetMockSupabase();
  jest.clearAllMocks();
  setReducedMotion(false);
  read.mockResolvedValue(true);
  mark.mockResolvedValue();
});

describe('launch screen on a later launch', () => {
  it('covers the app, hides the native splash once on screen, then goes when the app is ready', async () => {
    await open();
    expect(await screen.findByLabelText(LABEL)).toBeTruthy();
    expect(hide).not.toHaveBeenCalled();
    await layout();
    await layout();
    expect(hide).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByLabelText(LABEL)).toBeNull());
    expect(screen.getByText('Home screen')).toBeTruthy();
    expect(mark).not.toHaveBeenCalled();
  });

  it('stays while the session is still loading, then goes once it has loaded', async () => {
    let release!: () => void;
    (supabase.auth.getSession as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => (release = () => resolve({ data: { session: null }, error: null }))),
    );
    await open();
    expect(await screen.findByLabelText(LABEL)).toBeTruthy();
    await advance(5000);
    expect(screen.getByLabelText(LABEL)).toBeTruthy();
    await act(async () => release());
    await advance(FADE_MS);
    await waitFor(() => expect(screen.queryByLabelText(LABEL)).toBeNull());
  });

  it('goes for a signed-in member once their profile check is done, leaving the app', async () => {
    mockState.session = fakeSession('u1');
    mockState.profile = { id: 'u1', display_name: 'Leon', profile_sports: [{ skill_tier: 'Beginner' }] };
    await open();
    await waitFor(() => expect(screen.queryByLabelText(LABEL)).toBeNull());
    expect(screen.getByText('Home screen')).toBeTruthy();
  });

  it('still starts, with the short version, when the seen flag cannot be read', async () => {
    read.mockResolvedValue(null);
    await open();
    await waitFor(() => expect(screen.queryByLabelText(LABEL)).toBeNull());
    expect(mark).not.toHaveBeenCalled();
  });

  it('is short with reduced motion even on a first launch, and does not record the intro as seen', async () => {
    setReducedMotion(true);
    read.mockResolvedValue(false);
    await open();
    await waitFor(() => expect(screen.queryByLabelText(LABEL)).toBeNull());
    expect(mark).not.toHaveBeenCalled();
  });
});

describe('launch screen on the first launch', () => {
  beforeEach(() => {
    read.mockResolvedValue(false);
  });

  it('plays the whole intro even though the app is ready at once, and records it only at the end', async () => {
    await open();
    await flush();
    expect(screen.getByLabelText(LABEL)).toBeTruthy();

    await advance(1000);
    expect(screen.getByLabelText(LABEL)).toBeTruthy();
    expect(mark).not.toHaveBeenCalled();

    await advance(FULL_INTRO_MS - 1000);
    expect(screen.getByLabelText(LABEL)).toBeTruthy();
    expect(mark).not.toHaveBeenCalled();

    await advance(FADE_MS);
    expect(screen.queryByLabelText(LABEL)).toBeNull();
    expect(mark).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Home screen')).toBeTruthy();
  });
});
