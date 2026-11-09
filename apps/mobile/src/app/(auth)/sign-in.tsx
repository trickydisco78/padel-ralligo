import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (!signInError) return; // the session provider moves the user on
    // Only reached after a correct password, so this does not reveal whether an account exists.
    setError(
      signInError.code === 'email_not_confirmed'
        ? 'Please verify your email first. Check your inbox for the link.'
        : 'Invalid email or password',
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}>
            <ThemedText type="title">Sign in</ThemedText>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />
            {error ? (
              <ThemedText type="small" style={{ color: '#C62828' }}>
                {error}
              </ThemedText>
            ) : null}
            <PrimaryButton title="Sign in" onPress={submit} disabled={submitting} />
            <Link href="/sign-up">
              <ThemedText type="link" themeColor="primary">
                New here? Create an account
              </ThemedText>
            </Link>
            <Link href="/">
              <ThemedText type="link" themeColor="textSecondary">
                Continue browsing
              </ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}
