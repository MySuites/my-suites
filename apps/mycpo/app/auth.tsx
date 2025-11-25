// apps/mycpo/app/auth.tsx
import { useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import { supabase } from '@mycsuite/auth';
import { SharedButton } from '@mycsuite/ui';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{
    type: 'idle' | 'typing' | 'signing-in' | 'success' | 'error' | 'info';
    message?: string;
  }>({ type: 'idle' });

  const handleSignUp = async () => {
    setStatus({ type: 'signing-in', message: 'Creating account...' });
    // Use the returned `data` to determine whether Supabase created a
    // session immediately (auto-login) or sent a confirmation email
    // (no session). If no session is returned we will show a message
    // asking the user to check their email and avoid redirecting.
    // Build a redirect URL for confirmation emails. Use the public site
    // URL from env so it works across environments. If not provided,
    // default to `http://localhost:8081` (web dev server).
    const redirectTo = `${process.env.EXPO_PUBLIC_SITE_URL ?? 'http://localhost:8081'}/auth`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }

    if (data?.session) {
      setStatus({ type: 'success', message: 'Signed up and signed in.' });
    } else {
      setStatus({ type: 'info', message: 'Check your email for a confirmation link.' });
    }
  };

  const handleSignIn = async () => {
    setStatus({ type: 'signing-in', message: 'Signing in...' });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }
    setStatus({ type: 'success', message: 'Signed in.' });
  };

  return (
    <View className="flex-1 justify-center p-4">
      <TextInput
        className="p-3 mb-4 border border-gray-300 rounded-lg bg-white text-black"
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        className="p-3 mb-4 border border-gray-300 rounded-lg bg-white text-black"
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setStatus((s) => (s.type === 'idle' ? { type: 'typing' } : s));
        }}
        secureTextEntry
        autoCapitalize="none"
      />
      {/* Status message */}
      {status.type !== 'idle' && (
        <Text
          className={
            `mb-3 text-sm ` +
            (status.type === 'error'
              ? 'text-red-600'
              : status.type === 'success'
              ? 'text-green-600'
              : status.type === 'signing-in'
              ? 'text-blue-600'
              : 'text-gray-700')
          }
          accessibilityLiveRegion="polite"
        >
          {status.message ?? (status.type === 'typing' ? 'Typing...' : '')}
        </Text>
      )}
      <SharedButton title="Sign In" onPress={handleSignIn} />
      <SharedButton title="Sign Up" onPress={handleSignUp} />
    </View>
  );
}