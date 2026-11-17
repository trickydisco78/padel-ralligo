import { useSession, SignInPrompt } from '@padel/auth';
import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function MatchesScreen() {
  const { status } = useSession();
  if (status === 'signedOut') return <SignInPrompt message="Sign in to see your matches and messages." />;

  return <PlaceholderScreen title="Matches" />;
}
