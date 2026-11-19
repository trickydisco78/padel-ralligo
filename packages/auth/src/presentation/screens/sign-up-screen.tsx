import type { FieldErrors } from '@padel/core';
import { translateFieldErrors, useTranslation } from '@padel/i18n';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Checkbox, Button, FormField, ThemedText, ThemedView, spacing } from '@padel/ui';

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
            contentContainerStyle={{ padding: spacing.space6, gap: spacing.space4 }}>
            <ThemedText type="display">{t('signUp.title')}</ThemedText>

            {done ? (
              <>
                <ThemedText>
                  {t('signUp.checkEmail')}
                </ThemedText>
                <Link href="/sign-in" replace asChild>
                  <Button title={t('signUp.goToSignIn')} onPress={() => {}} />
                </Link>
              </>
            ) : (
              <>
                <FormField
                  label={t('signUp.email')}
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                />
                <FormField
                  label={t('signUp.password')}
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                  secureTextEntry
                  autoComplete="new-password"
                />
                <Checkbox
                  label={t('signUp.terms')}
                  checked={termsAccepted}
                  onChange={setTermsAccepted}
                  error={errors.termsAccepted}
                />
                <Checkbox
                  label={t('signUp.ageConfirmed')}
                  checked={ageConfirmed}
                  onChange={setAgeConfirmed}
                  error={errors.ageConfirmed}
                />
                {formError ? (
                  <ThemedText type="caption" themeColor="error600">
                    {formError}
                  </ThemedText>
                ) : null}
                <Button title={t('signUp.submit')} onPress={submit} disabled={submitting} />
                <Link href="/sign-in" replace>
                  <ThemedText type="label" themeColor="pink700">
                    {t('signUp.signInLink')}
                  </ThemedText>
                </Link>
                <Link href="/">
                  <ThemedText type="label" themeColor="muted">
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
