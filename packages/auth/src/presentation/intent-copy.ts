import type { AuthIntent } from '../domain/auth-intent';

type IntentCopyKeys = { title: string; body: string };

/** Translation keys (in the `auth` namespace) for what the guest was trying to do. */
export function copyKeysForIntent(intent: AuthIntent): IntentCopyKeys {
  return {
    title: `intent.${intent.type}.title`,
    body: `intent.${intent.type}.body`,
  };
}
