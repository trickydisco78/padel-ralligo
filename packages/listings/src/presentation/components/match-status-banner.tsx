import { useTranslation } from '@padel/i18n';
import { Banner } from '@padel/ui';

import type { JoinStatus } from '../../domain/join-request';

type Props = {
  /** The member's own request, if any. Withdrawn requests show nothing. */
  status: JoinStatus | null;
  /** The organiser, named in the pending and declined messages. */
  organiserName: string;
  /** No places left. A member with no request sees a notice; one with a pending request sees it noted. */
  full: boolean;
};

/**
 * The status strip at the top of a match for a member: pending, accepted ("You're in!"), declined, or a
 * notice that the match is full. Each has an icon and words, never colour alone.
 */
export function MatchStatusBanner({ status, organiserName, full }: Props) {
  const { t } = useTranslation('listings');
  if (status === 'pending') {
    return (
      <Banner variant="pending" title={t('matchBanner.pendingTitle')}>
        {full
          ? t('matchBanner.pendingFull', { name: organiserName })
          : t('matchBanner.pendingBody', { name: organiserName })}
      </Banner>
    );
  }
  if (status === 'accepted') {
    return (
      <Banner variant="success" title={t('matchBanner.acceptedTitle')}>
        {t('matchBanner.acceptedBody')}
      </Banner>
    );
  }
  if (status === 'declined') {
    return (
      <Banner variant="declined" title={t('matchBanner.declinedTitle')}>
        {t('matchBanner.declinedBody', { name: organiserName })}
      </Banner>
    );
  }
  if (full) {
    return (
      <Banner variant="info" icon="people" title={t('matchBanner.fullTitle')}>
        {t('matchBanner.fullBody')}
      </Banner>
    );
  }
  return null;
}
