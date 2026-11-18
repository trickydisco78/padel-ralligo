import type { FieldErrors } from '@padel/core';
import { translateFieldErrors, useTranslation } from '@padel/i18n';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckRow, PrimaryButton, TextField, ThemedText, ThemedView, Spacing } from '@padel/ui';

import { authService } from '../../composition';
import { MIN_PASSWORD_LENGTH, validateSignUp } from '../../domain/sign-up';

export function SignUpScreen() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  // Field errors are translation keys; `formError` is a raw message from the server.
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const result = validateSignUp({ email, password, termsAccepted, ageConfirmed });
    if (!result.ok) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    const outcome = await authService.signUp(email, password);
    setSubmitting(false);

    if (outcome.ok) {
      setDone(true);
    } else if (outcome.reason === 'already_registered') {
      setFieldErrors({ email: 'signUp.errors.alreadyRegistered' });
    } else {
      setFormError(outcome.message);
    }
  }

  const errors = translateFieldErrors(t, fieldErrors, { min: MIN_PASSWORD_LENGTH });

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}>
            <ThemedText type="title">{t('signUp.title')}</ThemedText>

            {done ? (
              <>
                <ThemedText>
                  {t('signUp.checkEmail')}
                </ThemedText>
                <Link href="/sign-in" replace asChild>
                  <PrimaryButton title={t('signUp.goToSignIn')} onPress={() => {}} />
                </Link>
              </>
            ) : (
              <>
                <TextField
                  label={t('signUp.email')}
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                />
                <TextField
                  label={t('signUp.password')}
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                  secureTextEntry
                  autoComplete="new-password"
                />
                <CheckRow
                  label={t('signUp.terms')}
                  checked={termsAccepted}
                  onChange={setTermsAccepted}
                  error={errors.termsAccepted}
                />
                <CheckRow
                  label={t('signUp.ageConfirmed')}
                  checked={ageConfirmed}
                  onChange={setAgeConfirmed}
                  error={errors.ageConfirmed}
                />
                {formError ? (
                  <ThemedText type="small" style={{ color: '#C62828' }}>
                    {formError}
                  </ThemedText>
                ) : null}
                <PrimaryButton title={t('signUp.submit')} onPress={submit} disabled={submitting} />
                <Link href="/sign-in" replace>
                  <ThemedText type="link" themeColor="primary">
                    {t('signUp.signInLink')}
                  </ThemedText>
                </Link>
                <Link href="/">
                  <ThemedText type="link" themeColor="textSecondary">
                    {t('signUp.continueBrowsing')}
                  </ThemedText>
                </Link>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
