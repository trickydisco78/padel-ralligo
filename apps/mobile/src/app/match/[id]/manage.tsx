import { formatDateRange } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { useSession } from '@padel/auth';
import { useManageMatch } from '@padel/listings';
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
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';

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
  const { view, listing, organiser, players, requests, state, isDeciding, events, refresh, retry } = useManageMatch({
    listingId: id,
    session: status,
    userId: user?.id,
  });
  const { tab, overlay, error } = state;
  const reviewing = overlay.kind === 'reviewing' ? overlay.person : null;
  const closing = overlay.kind === 'confirmingClose' ? overlay : null;

  useRefetchOnFocus(refresh);

  useEffect(() => {
    if (view === 'forbidden' && id) router.replace({ pathname: '/match/[id]', params: { id } });
  }, [view, id, router]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/discover');
  }

  const bar = <AppBar variant="detail" title={t('manage.title')} onBack={goBack} backLabel={t('match.back')} />;

  if (view === 'loading' || view === 'forbidden') {
    return (
      <ThemedView style={{ flex: 1 }}>
        {bar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator accessibilityLabel={tl('matchDetail.loading')} color={colors.pink500} />
        </View>
      </ThemedView>
    );
  }

  if (view === 'error') {
    return (
      <ThemedView style={{ flex: 1 }}>
        {bar}
        <View style={{ padding: spacing.space5, gap: spacing.space4 }}>
          <ThemedText accessibilityRole="alert" themeColor="error600">
            {t('manage.loadFailed')}
          </ThemedText>
          <Button title={tl('matchDetail.retry')} onPress={retry} />
        </View>
      </ThemedView>
    );
  }

  if (view === 'closed' || !listing) {
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
          onChange={events.selectTab}
          options={[
            { value: 'players', label: t('manage.players'), count: 1 + players.length },
            { value: 'requests', label: t('manage.requests'), count: requests.length },
          ]}
        />

        {error ? (
          <HelperText error>
            {error.kind === 'close' ? t('manage.closeFailed') : tl(`joinRequests.errors.${error.code}`)}
          </HelperText>
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
                onPress={() => events.openReview(person)}
                onAccept={() => events.accept(person)}
                onDecline={() => events.decline(person)}
                busy={isDeciding(person)}
              />
            ))}
            {requests.length === 0 ? <ThemedText themeColor="muted">{t('manage.noRequests')}</ThemedText> : null}
          </View>
        )}

        <View style={{ marginTop: spacing.space4 }}>
          <Button variant="secondary" title={t('manage.close')} onPress={events.requestClose} />
        </View>
      </ScrollView>

      <BottomSheet visible={reviewing !== null} title={reviewing?.name ?? ''} onDismiss={events.dismissReview}>
        {reviewing ? (
          <View style={{ gap: spacing.space4 }}>
            <View style={{ alignItems: 'center', gap: spacing.space2 }}>
              <Avatar name={reviewing.name} size="xl" variant="tint" />
              {reviewing.skillTier ? (
                <ThemedText themeColor="muted">{t('manage.level', { tier: reviewing.skillTier })}</ThemedText>
              ) : null}
            </View>
            <View style={{ gap: spacing.space3 }}>
              <Button title={t('manage.accept')} busy={isDeciding(reviewing)} disabled={isDeciding(reviewing)} onPress={() => events.accept(reviewing)} />
              <Button
                variant="secondary"
                title={t('manage.decline')}
                busy={isDeciding(reviewing)}
                disabled={isDeciding(reviewing)}
                onPress={() => events.decline(reviewing)}
              />
            </View>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={closing !== null}
        title={t('manage.closeTitle')}
        confirm={{ icon: 'clock', tone: 'pending', message: t('manage.closeMessage') }}
        onDismiss={events.dismissClose}>
        <Button title={t('manage.keepOpen')} onPress={events.dismissClose} />
        <Button
          variant="secondary"
          title={t('manage.closeConfirm')}
          busy={closing?.busy}
          disabled={closing?.busy}
          onPress={events.confirmClose}
        />
      </BottomSheet>
    </ThemedView>
  );
}
