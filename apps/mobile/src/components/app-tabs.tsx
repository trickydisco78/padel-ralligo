import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from '@padel/i18n';
import { colors, fontFamily } from '@padel/ui';

export default function AppTabs() {
  const { t } = useTranslation('app');
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.pink500}
      iconColor={{ default: colors.inkSoft, selected: colors.pink500 }}
      indicatorColor={colors.pink100}
      rippleColor={colors.pink100}
      labelStyle={{
        default: { color: colors.inkSoft, fontFamily: fontFamily[600], fontSize: 12 },
        selected: { color: colors.pink700, fontFamily: fontFamily[700], fontSize: 12 },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md={{ default: 'home', selected: 'home_filled' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Label>{t('tabs.discover')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Label>{t('tabs.create')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }}
          md={{ default: 'add_circle_outline', selected: 'add_circle' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="matches">
        <NativeTabs.Trigger.Label>{t('tabs.matches')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md={{ default: 'person_outline', selected: 'person' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
