// apps/mycpo/app/(tabs)/profile.tsx
import { useState, useEffect } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { useAuth, supabase } from '@mycsuite/auth';
import { SharedButton } from '@mycsuite/ui';

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
  
  return (
    <View className="flex-1 justify-center p-4">
      <TextInput
        className="p-3 mb-4 border border-gray-300 rounded-lg"
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        className="p-3 mb-4 border border-gray-300 rounded-lg"
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <SharedButton title="Update Profile" onPress={handleUpdateProfile} />
      <SharedButton title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}