import { useTranslation } from '@padel/i18n';
import { useSession, SignInPrompt } from '@padel/auth';
import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function MatchesScreen() {
  const { t } = useTranslation('app');
  const { status } = useSession();
  if (status === 'signedOut') return <SignInPrompt message={t('matches.signInMessage')} intent={{ type: 'openMessages' }} />;

  return <PlaceholderScreen title={t('tabs.matches')} />;
}
