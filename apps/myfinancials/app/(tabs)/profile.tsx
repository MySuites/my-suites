// apps/mycfo/app/(tabs)/profile.tsx
import { useState, useEffect } from 'react';
import { View, TextInput, Alert, StyleSheet, Text } from 'react-native';
import { useAuth, supabase } from '@mysuite/auth';
import { RaisedCard } from '@mysuite/ui';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useUITheme } from '@mysuite/ui';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (user) {
      // Fetch existing profile data when the component mounts
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) console.log('Error fetching profile:', error);
          if (data) {
            setUsername(data.username);
            setFullName(data.full_name);
          }
        });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    });

    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The protected routing in _layout.tsx will handle the redirect
  };
  
  const theme = useUITheme();
  const bg = theme.background;
  const text = theme.text;
  const border = theme.surface;

  return (
    <View className="bg-light dark:bg-dark" style={styles.container}>
      <ThemeToggle />
      <TextInput
        style={[styles.input, { backgroundColor: bg, borderColor: border, color: text }]}
        placeholder="Username"
        placeholderTextColor={'#9CA3AF'}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={[styles.input, { backgroundColor: bg, borderColor: border, color: text }]}
        placeholder="Full Name"
        placeholderTextColor={'#9CA3AF'}
        value={fullName}
        onChangeText={setFullName}
      />
      <RaisedCard onPress={handleUpdateProfile} className="h-12 rounded-full bg-primary dark:bg-primary-dark items-center justify-center mb-4">
        <Text className="text-white font-bold text-lg">Update Profile</Text>
      </RaisedCard>
      <RaisedCard onPress={handleSignOut} className="h-12 rounded-full bg-light-lighter dark:bg-dark-lighter items-center justify-center">
        <Text className="text-danger font-bold text-lg">Sign Out</Text>
      </RaisedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  input: {
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
});
