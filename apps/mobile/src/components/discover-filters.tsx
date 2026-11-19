import { SKILL_TIERS, type IsoDate, type SkillTier } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { DateField, ThemedText, spacing, Button } from '@padel/ui';
import { View } from 'react-native';

export type DiscoverFilters = {
  destinationId: string | null;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  level: SkillTier | null;
};

export const NO_FILTERS: DiscoverFilters = { destinationId: null, startDate: null, endDate: null, level: null };

type Destination = { id: string; name: string };

type Props = {
  filters: DiscoverFilters;
  onChange: (update: (current: DiscoverFilters) => DiscoverFilters) => void;
  destinations: readonly Destination[] | undefined;
  /** Dates only narrow matches, not players. */
  showDates: boolean;
  /** Bumped when the filters are replaced from outside, so the typed date fields pick up the new values. */
  filterVersion: number;
};

/** Explore places filters: destination ("Explore near"), dates for matches, and level. */
export function DiscoverFilterBlock({ filters, onChange, destinations, showDates, filterVersion }: Props) {
  const { t } = useTranslation('app');

  return (
    <View style={{ gap: spacing.space4 }}>
      <View style={{ gap: spacing.space1 }}>
        <ThemedText type="label">{t('discover.exploreNear')}</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 }}>
          <Button variant="choice"
            title={t('discover.allDestinations')}
            selected={filters.destinationId === null}
            onPress={() => onChange((f) => ({ ...f, destinationId: null }))}
          />
          {destinations?.map((d) => (
            <Button variant="choice"
              key={d.id}
              title={d.name}
              selected={filters.destinationId === d.id}
              onPress={() => onChange((f) => ({ ...f, destinationId: d.id }))}
            />
          ))}
        </View>
      </View>

      {showDates ? (
        <>
          <DateField
            key={`from-${filterVersion}`}
            label={t('discover.from')}
            value={filters.startDate}
            onChange={(startDate) => onChange((f) => ({ ...f, startDate }))}
          />
          <DateField
            key={`to-${filterVersion}`}
            label={t('discover.to')}
            value={filters.endDate}
            onChange={(endDate) => onChange((f) => ({ ...f, endDate }))}
          />
        </>
      ) : null}

      <View style={{ gap: spacing.space1 }}>
        <ThemedText type="label">{t('discover.level')}</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 }}>
          <Button variant="choice"
            title={t('discover.allLevels')}
            selected={filters.level === null}
            onPress={() => onChange((f) => ({ ...f, level: null }))}
          />
          {SKILL_TIERS.map((tier) => (
            <Button variant="choice"
              key={tier}
              title={tier}
              selected={filters.level === tier}
              onPress={() => onChange((f) => ({ ...f, level: tier }))}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
