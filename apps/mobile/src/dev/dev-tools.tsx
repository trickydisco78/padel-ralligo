import { useTranslation } from '@padel/i18n';
import { Button, spacing, ThemedText } from '@padel/ui';
import { useState } from 'react';
import { View } from 'react-native';

import { resetIntroSeen } from '@/splash/intro-seen';

type Flags = { dev: boolean; flag: string | undefined };

/**
 * Developer tools show in development builds, and in a release build made with `EXPO_PUBLIC_DEV_TOOLS=true`
 * (read when the app is built, so a store build never has it).
 */
export function devToolsEnabled({ dev, flag }: Flags = { dev: __DEV__, flag: process.env.EXPO_PUBLIC_DEV_TOOLS }): boolean {
  return dev || flag === 'true';
}

/** What the replay button is doing: waiting to be pressed, or the flag has been cleared. */
type ReplayState = 'idle' | 'cleared';

export function DevTools({ enabled = devToolsEnabled() }: { enabled?: boolean }) {
  const { t } = useTranslation('app');
  const [replay, setReplay] = useState<ReplayState>('idle');
  if (!enabled) return null;
  return (
    <View style={{ gap: spacing.space3 }}>
      <ThemedText type="headline">{t('dev.title')}</ThemedText>
      <Button
        variant="secondary"
        title={t('dev.replayIntro')}
        onPress={async () => {
          await resetIntroSeen();
          setReplay('cleared');
        }}
      />
      {replay === 'cleared' ? <ThemedText themeColor="muted">{t('dev.replayIntroDone')}</ThemedText> : null}
    </View>
  );
}
