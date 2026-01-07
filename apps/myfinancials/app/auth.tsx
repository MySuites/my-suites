// apps/mycfo/app/auth.tsx
import { useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import { supabase } from '@mysuite/auth';
import { RaisedCard } from '@mysuite/ui';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{
    type: 'idle' | 'typing' | 'signing-in' | 'success' | 'error' | 'info';
    message?: string;
  }>({ type: 'idle' });

  const handleSignUp = async () => {
    setStatus({ type: 'signing-in', message: 'Creating account...' });
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
        className="p-3 mb-4 border border-light rounded-lg bg-light text-apptext dark:bg-dark dark:text-dark dark:border-dark"
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        className="p-3 mb-4 border border-light rounded-lg bg-light text-apptext dark:bg-dark dark:text-dark dark:border-dark"
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
              : 'text-apptext dark:text-dark')
          }
          accessibilityLiveRegion="polite"
        >
          {status.message ?? (status.type === 'typing' ? 'Typing...' : '')}
        </Text>
      )}
      <RaisedCard onPress={handleSignIn} className="h-12 rounded-full bg-primary dark:bg-primary-dark items-center justify-center mb-4">
        <Text className="text-white font-bold text-lg">Sign In</Text>
      </RaisedCard>
      <RaisedCard onPress={handleSignUp} className="h-12 rounded-full bg-light-lighter dark:bg-dark-lighter items-center justify-center">
        <Text className="text-primary dark:text-primary-dark font-bold text-lg">Sign Up</Text>
      </RaisedCard>
    </View>
  );
}
