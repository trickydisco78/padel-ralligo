import { useSession } from '@/auth/session';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { SignInPrompt } from '@/components/sign-in-prompt';

export default function MatchesScreen() {
  const { status } = useSession();
  if (status === 'signedOut') return <SignInPrompt message="Sign in to see your matches and messages." />;

  return <PlaceholderScreen title="Matches" />;
}
