import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { AnimatedSplash } from './animated-splash';

jest.mock('react-native-svg', () => ({ __esModule: true, default: 'Svg', Circle: 'Circle', Rect: 'Rect', Path: 'Path' }));

const setReducedMotion = (value: boolean) =>
  (jest.requireMock('react-native-reanimated') as { __setReducedMotion: (v: boolean) => void }).__setReducedMotion(value);

// Each phase (intro, then fade) is advanced separately: React applies the intro-done state at the end of an act.
async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

const FULL_INTRO_MS = 2700 + 1500; // animation + read hold
const FADE_MS = 320;

function setup(props: Partial<React.ComponentProps<typeof AnimatedSplash>> = {}) {
  const onFinish = jest.fn();
  const onShown = jest.fn();
  const ui = (extra: Partial<React.ComponentProps<typeof AnimatedSplash>> = {}) => (
    <AnimatedSplash ready={false} intro="full" onFinish={onFinish} onShown={onShown} {...props} {...extra} />
  );
  return { onFinish, onShown, ui };
}

beforeEach(() => {
  jest.useFakeTimers();
  setReducedMotion(false);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('AnimatedSplash', () => {
  it('announces itself as loading in the app language', async () => {
    const { ui } = setup();
    await render(ui());
    expect(screen.getByLabelText('Fourth, loading')).toBeTruthy();
  });

  it('shows the wordmark, or only the mark when asked', async () => {
    const { ui } = setup();
    const view = await render(ui());
    expect(screen.getByText(/fourth/)).toBeTruthy();
    await view.rerender(ui({ showWordmark: false }));
    expect(screen.queryByText(/fourth/)).toBeNull();
  });

  it('says it is on screen once, however many times it is laid out', async () => {
    const { ui, onShown } = setup();
    await render(ui());
    const root = screen.getByLabelText('Fourth, loading');
    await fireEvent(root, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } } });
    await fireEvent(root, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } } });
    expect(onShown).toHaveBeenCalledTimes(1);
  });

  describe('full intro', () => {
    it('does not leave before the intro has finished, even if the app is ready at once', async () => {
      const { ui, onFinish } = setup({ ready: true });
      await render(ui());
      await advance(FULL_INTRO_MS - 1);
      expect(onFinish).not.toHaveBeenCalled();
      await advance(1);
      await advance(FADE_MS - 1);
      expect(onFinish).not.toHaveBeenCalled();
    });

    it('fades out after the intro when the app is ready, calling onFinish once', async () => {
      const { ui, onFinish } = setup({ ready: true });
      await render(ui());
      await advance(FULL_INTRO_MS);
      expect(onFinish).not.toHaveBeenCalled();
      await advance(FADE_MS);
      expect(onFinish).toHaveBeenCalledTimes(1);
      await advance(10_000);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('keeps waiting after the intro until the app is ready', async () => {
      const { ui, onFinish } = setup();
      const view = await render(ui());
      await advance(FULL_INTRO_MS);
      await advance(5000);
      expect(onFinish).not.toHaveBeenCalled();
      await view.rerender(ui({ ready: true }));
      await advance(FADE_MS);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('still waits for the intro when the app becomes ready part-way through', async () => {
      const { ui, onFinish } = setup();
      const view = await render(ui());
      await advance(1000);
      await view.rerender(ui({ ready: true }));
      await advance(FULL_INTRO_MS - 1000);
      await advance(FADE_MS - 1);
      expect(onFinish).not.toHaveBeenCalled();
      await advance(1);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('does not call onFinish after it has been unmounted', async () => {
      const { ui, onFinish } = setup({ ready: true });
      const view = await render(ui());
      await advance(FULL_INTRO_MS);
      await view.unmount();
      await advance(FADE_MS * 2);
      expect(onFinish).not.toHaveBeenCalled();
    });
  });

  describe('short version', () => {
    it('fades out as soon as the app is ready, with no minimum time', async () => {
      const { ui, onFinish } = setup({ intro: 'short', ready: true });
      await render(ui());
      await advance(FADE_MS - 1);
      expect(onFinish).not.toHaveBeenCalled();
      await advance(1);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('stays up until the app is ready', async () => {
      const { ui, onFinish } = setup({ intro: 'short' });
      const view = await render(ui());
      await advance(10_000);
      expect(onFinish).not.toHaveBeenCalled();
      await view.rerender(ui({ ready: true }));
      await advance(FADE_MS);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });
  });

  it('treats reduced motion like the short version, whatever intro was asked for', async () => {
    setReducedMotion(true);
    const { ui, onFinish } = setup({ intro: 'full', ready: true });
    await render(ui());
    await advance(FADE_MS);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
