import { formatDateRange } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { useRequireAuth, useSession } from '@padel/auth';
import {
  MATCH_HERO_HEIGHT,
  MatchActions,
  MatchDetail,
  MatchHero,
  MatchStatusBanner,
  useDiscoverListing,
  useMatchPeople,
  type MatchViewer,
} from '@padel/listings';
import { PlayerRow } from '@padel/players';
import { AppBar, colors, radius, spacing, ThemedView } from '@padel/ui';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';

/** How far the white sheet starts above the bottom of the pink hero. */
const SHEET_OVERLAP = 36;

/**
 * Public details of one match, over a pink hero. Anyone can open it. A guest asking to join is sent to
 * sign in and brought back here; a member asks for a place, sees their request's status and can
 * withdraw it; the organiser gets "Manage match". Who is on the match comes from the database, which
 * decides what each viewer may see.
 */
export default function MatchScreen() {
  const { t } = useTranslation('app');
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, user } = useSession();
  const requireAuth = useRequireAuth();
  const { listing, loading, failed, refetch } = useDiscoverListing(id);
  const signedIn = status === 'signedIn';
  const people = useMatchPeople(id, signedIn ? user?.id : undefined);
  const requestButton = useRef<ComponentRef<typeof View>>(null);

  useRefetchOnFocus(refetch);
  useRefetchOnFocus(people.refetch);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/discover');
  }

  async function share() {
    if (!listing) return;
    const message = t('match.shareMessage', {
      destination: listing.destinationName,
      date: formatDateRange(listing.startDate, listing.endDate ?? listing.startDate),
      url: Linking.createURL(`match/${listing.id}`),
    });
    try {
      await Share.share({ message });
    } catch {
      // The person closed the share sheet or sharing is unavailable: nothing to do.
    }
  }

  const info = people.people ?? null;
  const viewer: MatchViewer = !signedIn ? 'guest' : people.people === undefined && !people.failed ? 'loading' : (info?.viewerRole ?? 'member');
  const organiserName = info?.people.find((p) => p.kind === 'organiser')?.name ?? listing?.posterName ?? '';
  const accepted = info?.people.filter((p) => p.kind === 'player') ?? [];
  const full = !!listing && listing.spotsLeft <= 0;

  return (
    <ThemedView style={{ flex: 1 }}>
      <MatchHero />
      <AppBar
        variant="overlay"
        title={listing?.destinationName ?? ''}
        onBack={goBack}
        backLabel={t('match.back')}
        action={listing ? { icon: 'share', accessibilityLabel: t('match.share'), onPress: share } : undefined}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: MATCH_HERO_HEIGHT - SHEET_OVERLAP }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.space5,
            paddingTop: spacing.space6,
          }}>
          <MatchDetail
            listing={listing}
            loading={loading}
            failed={failed}
            onRetry={refetch}
            onBackToDiscover={() => router.replace('/discover')}
            banner={
              listing && viewer !== 'organiser' ? (
                <MatchStatusBanner status={info?.ownStatus ?? null} organiserName={organiserName} full={full} />
              ) : null
            }
            organiser={listing ? <PlayerRow name={organiserName} status="organiser" /> : null}
            players={
              accepted.length > 0 ? (
                <View style={{ gap: spacing.space2 }}>
                  {accepted.map((person, index) => (
                    <PlayerRow key={`${person.name}-${index}`} name={person.name} status="playing" />
                  ))}
                </View>
              ) : null
            }
          />
        </View>
      </ScrollView>
      {listing ? (
        <View
          style={{
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.space5,
            paddingTop: spacing.space3,
            paddingBottom: Math.max(insets.bottom, spacing.space4),
          }}>
          <MatchActions
            listing={listing}
            viewer={viewer}
            ownStatus={info?.ownStatus ?? null}
            pendingCount={info?.pendingCount ?? 0}
            organiserName={organiserName}
            requestButtonRef={requestButton}
            onGuestRequest={() => requireAuth({ type: 'joinMatch', matchId: listing.id }, { returnFocusRef: requestButton })}
            onManage={() => router.push({ pathname: '/match/[id]/manage', params: { id: listing.id } })}
            onFindSimilar={() => router.navigate({ pathname: '/discover', params: { destinationId: listing.destinationId } })}
          />
        </View>
      ) : null}
    </ThemedView>
  );
}
