import type { AuthIntent } from '@padel/auth';
/**
 * The only navigation the app needs to resume an intent. `router` from `expo-router` satisfies it.
 * Method syntax and plain strings keep this independent of the generated typed-routes file.
 */
export type IntentNavigator = {
  navigate(href: string): void;
  push(href: string): void;
};

/**
 * Where each intent leads. Match ids were validated when the intent was recorded, so they are safe
 * to place in a route. The tab intents with no screen of their own yet go to the closest tab.
 */
export function goToIntent(navigator: IntentNavigator, intent: AuthIntent, currentPath?: string) {
  switch (intent.type) {
    case 'joinMatch': {
      // Pushed on top of whatever the user is now on, so Back returns there. If they are already on
      // the match (the sign-in screens were opened over it), there is nothing to do.
      const path = `/match/${intent.matchId}`;
      if (currentPath !== path) navigator.push(path);
      return;
    }
    case 'connectPlayer':
      // There is no player page and Connect is not active yet, so the guest goes back to the list.
      navigator.navigate('/discover?view=players');
      return;
    case 'createMatch':
      navigator.navigate('/create');
      return;
    case 'openMessages':
    case 'openPersonalMatches':
      navigator.navigate('/matches');
      return;
    case 'openProfile':
      navigator.navigate('/profile');
      return;
  }
}
