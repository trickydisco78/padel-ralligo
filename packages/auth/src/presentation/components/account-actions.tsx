import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { useTranslation } from '@padel/i18n';
import { Button, spacing } from '@padel/ui';

import type { AuthIntent } from '../../domain/auth-intent';
import { useOptionalAuthIntent } from '../auth-intent-context';

type Props = {
  /** What the guest was trying to do; recorded so the app can take them back after they authenticate. */
  intent?: AuthIntent;
  /** Called just before navigating, e.g. to close the sheet these actions are shown in. */
  onNavigate?: () => void;
};

/** Create-account and sign-in actions: the one place they are offered, wherever a guest needs an account. */
export function AccountActions({ intent, onNavigate }: Props) {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const intents = useOptionalAuthIntent();

  function go(href: '/sign-in' | '/sign-up') {
    if (intent) intents?.setIntent(intent);
    onNavigate?.();
    router.push(href);
  }

  return (
    <View style={{ gap: spacing.space4 }}>
      <Button title={t('actions.createAccount')} onPress={() => go('/sign-up')} />
      <Button variant="secondary" title={t('actions.signIn')} onPress={() => go('/sign-in')} />
    </View>
  );
}
