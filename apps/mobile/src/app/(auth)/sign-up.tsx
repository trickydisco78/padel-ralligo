import { validateSignUp, type FieldErrors } from '@repo/core';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckRow } from '@/components/check-row';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // The database refuses sign up without both, and stamps the time itself.
      options: { data: { terms_accepted: true, age_confirmed: true } },
    });
    setSubmitting(false);

    if (error) {
      setErrors({ form: error.message });
    } else if (data.user && data.user.identities?.length === 0) {
      // With email confirmation on, an existing address returns a user with no identities.
      setErrors({ email: 'An account with this email already exists' });
    } else {
      setDone(true);
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
