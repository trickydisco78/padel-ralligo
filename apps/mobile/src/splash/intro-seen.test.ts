import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { markIntroSeen, readIntroSeen } from './intro-seen';

// The global test setup replaces this module; these tests are for the real one.
jest.unmock('@/splash/intro-seen');
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

const store = SecureStore as jest.Mocked<typeof SecureStore>;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('intro seen flag', () => {
  it('reads true when the flag is stored', async () => {
    store.getItemAsync.mockResolvedValue('1');
    await expect(readIntroSeen()).resolves.toBe(true);
    expect(store.getItemAsync).toHaveBeenCalledWith('launch.introSeen');
  });

  it('reads false when nothing is stored yet', async () => {
    store.getItemAsync.mockResolvedValue(null);
    await expect(readIntroSeen()).resolves.toBe(false);
  });

  it('reads null when the store cannot be read, so launch is never blocked', async () => {
    store.getItemAsync.mockRejectedValue(new Error('keychain unavailable'));
    await expect(readIntroSeen()).resolves.toBeNull();
  });

  it('stores only a flag', async () => {
    store.setItemAsync.mockResolvedValue();
    await markIntroSeen();
    expect(store.setItemAsync).toHaveBeenCalledWith('launch.introSeen', '1');
  });

  it('does not fail when the flag cannot be written', async () => {
    store.setItemAsync.mockRejectedValue(new Error('full'));
    await expect(markIntroSeen()).resolves.toBeUndefined();
  });

  it('never touches the store off native platforms', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await expect(readIntroSeen()).resolves.toBeNull();
    await markIntroSeen();
    expect(store.getItemAsync).not.toHaveBeenCalled();
    expect(store.setItemAsync).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});
