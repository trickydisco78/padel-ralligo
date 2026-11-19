import { formatDateRange } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { useSession } from '@padel/auth';
import {
  joinErrorCode,
  useCloseListing,
  useDecideRequest,
  useDiscoverListing,
  useMatchPeople,
  type MatchPerson,
} from '@padel/listings';
import { PlayerRow } from '@padel/players';
import {
  AppBar,
  Avatar,
  BottomSheet,
  Button,
  colors,
  HelperText,
  SegmentedControl,
  spacing,
  ThemedText,
  ThemedView,
} from '@padel/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';

type Tab = 'players' | 'requests';

/**
 * The organiser's view of their own match: who is playing and who is waiting, with accept and decline,
 * and a way to close the match. Anyone else is sent to the public details; the database decides who
 * the organiser is, so this screen shows nothing to a visitor even before the redirect.
 */
export default function ManageMatchScreen() {
  const { t } = useTranslation('app');
  const { t: tl } = useTranslation('listings');
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status, user } = useSession();
  const signedIn = status === 'signedIn';
  const { listing, loading: listingLoading, refetch: refetchListing } = useDiscoverListing(id);
  const { people, loading: peopleLoading, failed, refetch } = useMatchPeople(id, signedIn ? user?.id : undefined);
  const decide = useDecideRequest();
  const closeListing = useCloseListing();
  const [tab, setTab] = useState<Tab>('requests');
  const [reviewing, setReviewing] = useState<MatchPerson | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useRefetchOnFocus(refetch);
  useRefetchOnFocus(refetchListing);

  const notOrganiser = status !== 'loading' && (!signedIn || (people !== undefined && people?.viewerRole !== 'organiser'));
  useEffect(() => {
    if (notOrganiser && id) router.replace({ pathname: '/match/[id]', params: { id } });
  }, [notOrganiser, id, router]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/discover');
  }

  async function decideRequest(person: MatchPerson, accept: boolean) {
    if (!person.requestId) return;
    setErrorKey(null);
    try {
      await decide.mutateAsync({ requestId: person.requestId, accept });
      setReviewing(null);
    } catch (error) {
      setReviewing(null);
      setErrorKey(`joinRequests.errors.${joinErrorCode(error)}`);
    }
  }

  async function closeMatch() {
    setErrorKey(null);
    try {
      await closeListing.mutateAsync(id);
      setCloseOpen(false);
    } catch {
      setCloseOpen(false);
      setErrorKey('manage-close-failed');
    }
  }

  const bar = <AppBar variant="detail" title={t('manage.title')} onBack={goBack} backLabel={t('match.back')} />;
  const waiting = listingLoading || peopleLoading || notOrganiser || status === 'loading';

  if (waiting) {
    return (
      <ThemedView style={{ flex: 1 }}>
        {bar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator accessibilityLabel={tl('matchDetail.loading')} color={colors.pink500} />
        </View>
      </ThemedView>
    );
  }

  if (failed || !people) {
    return (
      <ThemedView style={{ flex: 1 }}>
        {bar}
        <View style={{ padding: spacing.space5, gap: spacing.space4 }}>
          <ThemedText accessibilityRole="alert" themeColor="error600">
            {t('manage.loadFailed')}
          </ThemedText>
          <Button title={tl('matchDetail.retry')} onPress={() => refetch()} />
        </View>
      </ThemedView>
    );
  }

  if (!listing) {
    return (
      <ThemedView style={{ flex: 1 }}>
        {bar}
        <View style={{ padding: spacing.space5, gap: spacing.space4 }}>
          <ThemedText type="headline" accessibilityRole="header">
            {t('manage.closedTitle')}
          </ThemedText>
          <ThemedText themeColor="muted">{t('manage.closedBody')}</ThemedText>
          <Button title={tl('matchDetail.backToDiscover')} onPress={() => router.replace('/discover')} />
        </View>
      </ThemedView>
    );
  }

  const organiser = people.people.find((p) => p.kind === 'organiser');
  const players = people.people.filter((p) => p.kind === 'player');
  const requests = people.people.filter((p) => p.kind === 'request');

  return (
    <ThemedView style={{ flex: 1 }}>
      {bar}
      <ScrollView contentContainerStyle={{ padding: spacing.space5, gap: spacing.space4 }}>
        <View style={{ gap: spacing.space1 }}>
          <ThemedText type="headline" accessibilityRole="header">
            {listing.destinationName}
          </ThemedText>
          <ThemedText type="caption" themeColor="muted">
            {formatDateRange(listing.startDate, listing.endDate ?? listing.startDate)}
            {listing.startTime ? ` · ${listing.startTime}` : ''}
          </ThemedText>
        </View>

        <SegmentedControl
          accessibilityLabel={t('manage.title')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'players', label: t('manage.players'), count: 1 + players.length },
            { value: 'requests', label: t('manage.requests'), count: requests.length },
          ]}
        />

        {errorKey ? (
          <HelperText error>{errorKey === 'manage-close-failed' ? t('manage.closeFailed') : tl(errorKey)}</HelperText>
        ) : null}

        {tab === 'players' ? (
          <View style={{ gap: spacing.space2 }}>
            {organiser ? <PlayerRow name={organiser.name} status="organiser" /> : null}
            {players.map((person, index) => (
              <PlayerRow key={`${person.name}-${index}`} name={person.name} status="playing" />
            ))}
            {players.length === 0 ? <ThemedText themeColor="muted">{t('manage.noPlayers')}</ThemedText> : null}
          </View>
        ) : (
          <View style={{ gap: spacing.space2 }}>
            {requests.map((person) => (
              <PlayerRow
                key={person.requestId ?? person.name}
                name={person.name}
                status="requesting"
                onPress={() => setReviewing(person)}
                onAccept={() => decideRequest(person, true)}
                onDecline={() => decideRequest(person, false)}
              />
            ))}
            {requests.length === 0 ? <ThemedText themeColor="muted">{t('manage.noRequests')}</ThemedText> : null}
          </View>
        )}

        <View style={{ marginTop: spacing.space4 }}>
          <Button variant="secondary" title={t('manage.close')} onPress={() => setCloseOpen(true)} />
        </View>
      </ScrollView>

      <BottomSheet visible={reviewing !== null} title={reviewing?.name ?? ''} onDismiss={() => setReviewing(null)}>
        {reviewing ? (
          <View style={{ gap: spacing.space4 }}>
            <View style={{ alignItems: 'center', gap: spacing.space2 }}>
              <Avatar name={reviewing.name} size="xl" variant="tint" />
              {reviewing.skillTier ? (
                <ThemedText themeColor="muted">{t('manage.level', { tier: reviewing.skillTier })}</ThemedText>
              ) : null}
            </View>
            <View style={{ gap: spacing.space3 }}>
              <Button title={t('manage.accept')} busy={decide.isPending} disabled={decide.isPending} onPress={() => decideRequest(reviewing, true)} />
              <Button
                variant="secondary"
                title={t('manage.decline')}
                busy={decide.isPending}
                disabled={decide.isPending}
                onPress={() => decideRequest(reviewing, false)}
              />
            </View>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={closeOpen}
        title={t('manage.closeTitle')}
        confirm={{ icon: 'clock', tone: 'pending', message: t('manage.closeMessage') }}
        onDismiss={() => setCloseOpen(false)}>
        <Button title={t('manage.keepOpen')} onPress={() => setCloseOpen(false)} />
        <Button
          variant="secondary"
          title={t('manage.closeConfirm')}
          busy={closeListing.isPending}
          disabled={closeListing.isPending}
          onPress={closeMatch}
        />
      </BottomSheet>
    </ThemedView>
  );
}
