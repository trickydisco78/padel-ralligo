import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@padel/i18n';
import { Button, FormField, ThemedText, ThemedView, spacing } from '@padel/ui';

import { authService } from '../../composition';

export function SignInScreen() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const result = await authService.signIn(email, password);
    setSubmitting(false);

    if (result.ok) return; // the session provider moves the user on
    setError(
      result.reason === 'email_not_confirmed'
        ? t('signIn.errors.emailNotConfirmed')
        : t('signIn.errors.invalidCredentials'),
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: spacing.space6, gap: spacing.space4 }}>
            <ThemedText type="display">{t('signIn.title')}</ThemedText>
            <FormField
              label={t('signIn.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            <FormField
              label={t('signIn.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />
            {error ? (
              <ThemedText type="caption" themeColor="error600">
                {error}
              </ThemedText>
            ) : null}
            <Button title={t('signIn.submit')} onPress={submit} disabled={submitting} />
            <Link href="/sign-up" replace>
              <ThemedText type="label" themeColor="pink700">
                {t('signIn.createAccountLink')}
              </ThemedText>
            </Link>
            <Link href="/">
              <ThemedText type="label" themeColor="muted">
                {t('signIn.continueBrowsing')}
              </ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
