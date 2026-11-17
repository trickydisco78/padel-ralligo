import type { FieldErrors } from '@padel/core';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckRow, PrimaryButton, TextField, ThemedText, ThemedView, Spacing } from '@padel/ui';

import { authService } from '../../composition';
import { validateSignUp } from '../../domain/sign-up';

export function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const result = validateSignUp({ email, password, termsAccepted, ageConfirmed });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const outcome = await authService.signUp(email, password);
    setSubmitting(false);

    if (outcome.ok) {
      setDone(true);
    } else if (outcome.reason === 'already_registered') {
      setErrors({ email: 'An account with this email already exists' });
    } else {
      setErrors({ form: outcome.message });
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}>
            <ThemedText type="title">Create account</ThemedText>

            {done ? (
              <>
                <ThemedText>
                  Check your email to verify your account, then sign in.
                </ThemedText>
                <Link href="/sign-in" asChild>
                  <PrimaryButton title="Go to sign in" onPress={() => {}} />
                </Link>
              </>
            ) : (
              <>
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                />
                <TextField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                  secureTextEntry
                  autoComplete="new-password"
                />
                <CheckRow
                  label="I accept the terms and privacy policy"
                  checked={termsAccepted}
                  onChange={setTermsAccepted}
                  error={errors.termsAccepted}
                />
                <CheckRow
                  label="I am 18 or over"
                  checked={ageConfirmed}
                  onChange={setAgeConfirmed}
                  error={errors.ageConfirmed}
                />
                {errors.form ? (
                  <ThemedText type="small" style={{ color: '#C62828' }}>
                    {errors.form}
                  </ThemedText>
                ) : null}
                <PrimaryButton title="Sign up" onPress={submit} disabled={submitting} />
                <Link href="/sign-in">
                  <ThemedText type="link" themeColor="primary">
                    Already have an account? Sign in
                  </ThemedText>
                </Link>
                <Link href="/">
                  <ThemedText type="link" themeColor="textSecondary">
                    Continue browsing
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
