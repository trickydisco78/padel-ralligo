// Use the Jest stand-in for Reanimated everywhere (see reanimated-mock.ts).
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
