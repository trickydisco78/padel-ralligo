import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from '@padel/i18n';
import { Colors } from '@padel/ui';

export default function AppTabs() {
  const { t } = useTranslation('app');
  const colors = Colors.light;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.primary}
      indicatorColor={colors.primaryTint}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Label>{t('tabs.discover')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Label>{t('tabs.create')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle" md="add_circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="matches">
        <NativeTabs.Trigger.Label>{t('tabs.matches')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
