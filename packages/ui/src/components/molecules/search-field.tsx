import type { ComponentProps } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { useTranslation } from '@padel/i18n';

import { Icon } from '../atoms/icon';
import { Input } from '../atoms/input';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  /** Be specific: "Search courts or area", not "Search". */
  placeholder: string;
  /** Required: there is no visible label. */
  accessibilityLabel: string;
  /** For moving focus into the field, e.g. when arriving from a search entry elsewhere. */
  ref?: ComponentProps<typeof TextInput>['ref'];
};

/** A pill-shaped input with a search icon and a clear button once there is text. */
export function SearchField({ value, onChangeText, placeholder, accessibilityLabel, ref }: Props) {
  const { t } = useTranslation('ui');
  return (
    <View>
      <Input
        ref={ref}
        shape="pill"
        paddingLeft={50}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        style={{ paddingRight: 52 }}
      />
      <View pointerEvents="none" style={{ position: 'absolute', left: 18, top: 0, bottom: 0, justifyContent: 'center' }}>
        <Icon name="search" color="pink700" size={20} />
      </View>
      {value !== '' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('searchField.clear')}
          onPress={() => onChangeText('')}
          style={{
            position: 'absolute',
            right: 6,
            top: 6,
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="close" color="inkSoft" size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}
