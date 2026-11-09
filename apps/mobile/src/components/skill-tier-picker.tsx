import { SKILL_TIERS, type SkillTier } from '@repo/core';
import { View } from 'react-native';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Props = {
  value: SkillTier | null;
  onChange: (tier: SkillTier) => void;
  error?: string;
};

export function SkillTierPicker({ value, onChange, error }: Props) {
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="smallBold">Padel skill level</ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {SKILL_TIERS.map((tier) => (
          <Chip key={tier} label={tier} selected={tier === value} onPress={() => onChange(tier)} />
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
