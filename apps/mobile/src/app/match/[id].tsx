import { useTranslation } from '@padel/i18n';
import { useRequireAuth, useSession } from '@padel/auth';
import { MatchDetail, useDiscoverListing } from '@padel/listings';
import { PrimaryButton, Spacing, ThemedText, ThemedView } from '@padel/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Public details of one match. Anyone can open it; "Join match" is the first action that needs an
 * account. A guest is asked to sign in or create one and brought back here. A signed-in user sees
 * the button disabled, because there is no join feature yet and nothing here writes a join.
 */
export default function MatchScreen() {
  const { t } = useTranslation('app');
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  const requireAuth = useRequireAuth();
  const { listing, loading, failed, refetch } = useDiscoverListing(id);
  const joinButton = useRef<ComponentRef<typeof View>>(null);
  const signedIn = status === 'signedIn';

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/discover');
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('match.back')}
            onPress={goBack}
            hitSlop={8}
            style={{ minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' }}>
            <ThemedText type="link" themeColor="primary">
              {t('match.backLink')}
            </ThemedText>
          </Pressable>

          <MatchDetail
            listing={listing}
            loading={loading}
            failed={failed}
            onRetry={refetch}
            onBackToDiscover={() => router.replace('/discover')}
            footer={
              listing ? (
                <PrimaryButton
                  ref={joinButton}
                  title={t('match.join')}
                  disabled={signedIn}
                  accessibilityHint={signedIn ? t('match.joinUnavailable') : undefined}
                  onPress={() => requireAuth({ type: 'joinMatch', matchId: listing.id }, { returnFocusRef: joinButton })}
                />
              ) : null
            }
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
