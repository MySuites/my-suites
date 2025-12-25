import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { useAuth, supabase } from '@mysuite/auth';
import { useUITheme, ThemedView } from '@mysuite/ui';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

export default function SettingsScreen() {
  const { user } = useAuth();
  const theme = useUITheme();
  const [username, setUsername] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) console.log('Error fetching profile:', error);
          if (data) {
            setUsername(data.username || '');
            setFullName(data.full_name || '');
          }
        });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    });
    setLoading(false);

    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Router will handle redirect based on auth state change in _layout
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            // Placeholder for delete logic
            Alert.alert('Not Implemented', 'Account deletion logic to be implemented.');
          } 
        }
      ]
    );
  };

  return (
    <ThemedView className="flex-1">
      <ScreenHeader title="Settings" />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Appearance</Text>
          <ThemeToggle />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Account</Text>
          <View className="py-3">
            <Text className="text-base text-apptext dark:text-apptext-dark">Email</Text>
            <Text className="text-base text-apptext dark:text-apptext-dark">{user?.email}</Text>
          </View>
          
          <View className="py-3">
            <Text className="text-base text-apptext dark:text-apptext-dark">Username</Text>
            <TextInput
              className="p-3 border border-border dark:border-border-dark rounded-lg mt-2 text-base text-apptext dark:text-apptext-dark"
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={theme.icon || "#9ca3af"}
            />
          </View>

          <View className="py-3">
            <Text className="text-base text-apptext dark:text-apptext-dark">Full Name</Text>
            <TextInput
              className="p-3 border border-border dark:border-border-dark rounded-lg mt-2 text-base text-apptext dark:text-apptext-dark"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor={theme.icon || "#9ca3af"}
            />
          </View>

          <TouchableOpacity 
            className="mt-4 p-4 items-center bg-bg-dark dark:bg-bg-dark-dark rounded-lg" 
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <Text className="text-base font-semibold text-primary dark:text-primary-dark">{loading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Legal</Text>
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-border dark:border-border-dark" onPress={() => Alert.alert('Privacy Policy', 'Link to Privacy Policy')}>
            <Text className="text-base text-apptext dark:text-apptext-dark">Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.icon || '#ccc'} />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-border dark:border-border-dark" onPress={() => Alert.alert('Terms of Service', 'Link to Terms of Service')}>
            <Text className="text-base text-apptext dark:text-apptext-dark">Terms of Service</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.icon || '#ccc'} />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <TouchableOpacity className="p-4 items-center border-b border-border dark:border-border-dark" onPress={handleSignOut}>
            <Text className="text-base font-semibold text-primary dark:text-primary-dark">Sign Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="mt-2 text-center items-center p-4" onPress={handleDeleteAccount}>
            <Text className="text-base font-semibold text-red-500">Delete Account</Text>
          </TouchableOpacity>
        </View>
        
        <Text className="text-center text-xs text-gray-500 mt-6">Version 1.0.0</Text>
      </ScrollView>
    </ThemedView>
  );
}
