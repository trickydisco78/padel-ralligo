import { SKILL_TIERS, type SkillTier } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { View } from 'react-native';

import { Chip, ThemedText, Spacing } from '@padel/ui';

type Props = {
  value: SkillTier | null;
  onChange: (tier: SkillTier) => void;
  error?: string;
};

export function SkillTierPicker({ value, onChange, error }: Props) {
  const { t } = useTranslation('profiles');
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="smallBold">{t('skillTierPicker.label')}</ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {SKILL_TIERS.map((tier) => (
          <Chip key={tier} label={t(`skillTierPicker.tiers.${tier}`)} selected={tier === value} onPress={() => onChange(tier)} />
        ))}
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: '#C62828' }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
