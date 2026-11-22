// Tests that render the app shell should not play a first-launch intro or touch the keychain. The launch
// screen's own tests replace this with their own control over the flag.
jest.mock('@/splash/intro-seen', () => ({
  readIntroSeen: jest.fn(async () => true),
  markIntroSeen: jest.fn(async () => {}),
}));
