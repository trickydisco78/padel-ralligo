import type { AuthIntent } from '../domain/auth-intent';

type IntentCopy = { title: string; body: string };

const COPY: Record<AuthIntent['type'], IntentCopy> = {
  joinMatch: {
    title: 'Join this match',
    body: 'Create a free account or sign in to reserve your place and connect with other players.',
  },
  createMatch: {
    title: 'Post a match',
    body: 'Create a free account or sign in to post a match and find players to join you.',
  },
  openMessages: {
    title: 'Your messages',
    body: 'Create a free account or sign in to message other players.',
  },
  openPersonalMatches: {
    title: 'Your matches',
    body: 'Create a free account or sign in to see your matches and manage your games.',
  },
  openProfile: {
    title: 'Your padel profile',
    body: 'Sign in or create an account to connect with players, manage your games and track your activity.',
  },
};

/** The title and explanation the contextual sheet shows for what the guest was trying to do. */
export function copyForIntent(intent: AuthIntent): IntentCopy {
  return COPY[intent.type];
}
