import { toIsoDate } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { BottomSheet, Button, HelperText, spacing } from '@padel/ui';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';

import { joinErrorCode, type JoinStatus } from '../../domain/join-request';
import type { DiscoverListing } from '../../domain/listing';
import { useRequestToJoin, useWithdrawRequest } from '../hooks/use-join-requests';

export type MatchViewer = 'guest' | 'loading' | 'organiser' | 'requester' | 'member';

type Props = {
  listing: DiscoverListing;
  /** Who is looking. `loading` is a signed-in member whose role has not arrived yet. */
  viewer: MatchViewer;
  /** The member's own request, if any. */
  ownStatus: JoinStatus | null;
  /** The organiser's waiting requests. */
  pendingCount: number;
  /** The organiser, named in the confirmation. */
  organiserName: string;
  /** A guest asks to join: the screen opens the contextual sign-in sheet. */
  onGuestRequest: () => void;
  onManage: () => void;
  onFindSimilar: () => void;
  /** For moving screen-reader focus back to the request button after the sheet it opened closes. */
  requestButtonRef?: ComponentProps<typeof Button>['ref'];
};

/**
 * The pinned action area of a match, by state: Request to join, Withdraw request, Find similar matches,
 * Manage match, or nothing when the match is full. It owns the "Request sent!" and "Withdraw request?"
 * sheets and the reason a request failed.
 */
export function MatchActions({
  listing,
  viewer,
  ownStatus,
  pendingCount,
  organiserName,
  onGuestRequest,
  onManage,
  onFindSimilar,
  requestButtonRef,
}: Props) {
  const { t } = useTranslation('listings');
  const request = useRequestToJoin();
  const withdraw = useWithdrawRequest();
  const [sentOpen, setSentOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const full = listing.spotsLeft <= 0;
  const started = listing.startDate < toIsoDate(new Date());

  async function sendRequest() {
    setErrorKey(null);
    try {
      await request.mutateAsync(listing.id);
      setSentOpen(true);
    } catch (error) {
      setErrorKey(`joinRequests.errors.${joinErrorCode(error)}`);
    }
  }

  async function confirmWithdraw() {
    setErrorKey(null);
    try {
      await withdraw.mutateAsync(listing.id);
      setWithdrawOpen(false);
    } catch (error) {
      setWithdrawOpen(false);
      setErrorKey(`joinRequests.errors.${joinErrorCode(error)}`);
    }
  }

  let action: ReactNode = null;
  if (viewer === 'organiser') {
    action = (
      <Button
        title={pendingCount > 0 ? t('matchActions.manageCount', { count: pendingCount }) : t('matchActions.manage')}
        icon="people"
        onPress={onManage}
      />
    );
  } else if (viewer === 'loading') {
    action = <Button title={t('matchActions.request')} disabled onPress={() => {}} />;
  } else if (ownStatus === 'pending' || (ownStatus === 'accepted' && !started)) {
    action = <Button variant="secondary" title={t('matchActions.withdraw')} onPress={() => setWithdrawOpen(true)} />;
  } else if (ownStatus === 'declined') {
    action = <Button title={t('matchActions.findSimilar')} icon="search" onPress={onFindSimilar} />;
  } else if (ownStatus === 'accepted') {
    action = null;
  } else if (!full) {
    action = (
      <Button
        ref={requestButtonRef}
        title={t('matchActions.request')}
        busy={request.isPending}
        disabled={request.isPending}
        onPress={viewer === 'guest' ? onGuestRequest : sendRequest}
      />
    );
  }

  return (
    <View style={{ gap: spacing.space3 }}>
      {errorKey ? <HelperText error>{t(errorKey)}</HelperText> : null}
      {action}

      <BottomSheet
        visible={sentOpen}
        title={t('matchSheets.sentTitle')}
        confirm={{ icon: 'checkCircle', message: t('matchSheets.sentMessage', { name: organiserName }) }}
        onDismiss={() => setSentOpen(false)}>
        <Button title={t('matchSheets.done')} onPress={() => setSentOpen(false)} />
      </BottomSheet>

      <BottomSheet
        visible={withdrawOpen}
        title={t('matchSheets.withdrawTitle')}
        confirm={{ icon: 'clock', tone: 'pending', message: t('matchSheets.withdrawMessage') }}
        onDismiss={() => setWithdrawOpen(false)}>
        <Button title={t('matchSheets.keep')} onPress={() => setWithdrawOpen(false)} />
        <Button
          variant="secondary"
          title={t('matchSheets.withdraw')}
          busy={withdraw.isPending}
          disabled={withdraw.isPending}
          onPress={confirmWithdraw}
        />
      </BottomSheet>
    </View>
  );
}
