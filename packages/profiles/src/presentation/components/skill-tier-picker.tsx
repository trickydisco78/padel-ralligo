import { SKILL_TIERS, type SkillTier } from '@padel/core';
import { useTranslation } from '@padel/i18n';
import { View } from 'react-native';

import { HelperText, Radio, ThemedText, spacing } from '@padel/ui';

type Props = {
  value: SkillTier | null;
  onChange: (tier: SkillTier) => void;
  error?: string;
};

/** Choose one skill tier. Radios, not pills: this is a form answer, not a filter. */
export function SkillTierPicker({ value, onChange, error }: Props) {
  const { t } = useTranslation('profiles');
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('skillTierPicker.label')} style={{ gap: spacing.space1 }}>
      <ThemedText type="label">{t('skillTierPicker.label')}</ThemedText>
      <View>
        {SKILL_TIERS.map((tier) => (
          <Radio key={tier} label={t(`skillTierPicker.tiers.${tier}`)} selected={tier === value} onSelect={() => onChange(tier)} />
        ))}
      </View>
      {error ? <HelperText error>{error}</HelperText> : null}
    </View>
  );
}
