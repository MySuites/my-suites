import { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, Alert } from 'react-native';
import { useAuth, supabase } from '@mysuite/auth';
import { useUITheme, RaisedButton, IconSymbol } from '@mysuite/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { ProfileRepository } from '../../providers/ProfileRepository';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';

// Removed AuthForm import

export default function ProfileScreen() {
  const { user } = useAuth();
  const theme = useUITheme();
  const { lastSyncedAt, sync, isSyncing } = useWorkoutManager();
  // const router = useRouter(); // If needed for redirects, but auth state change handles it? 
  // No, useAuth handles session changes.
  
  // Profile State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [tempFullName, setTempFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Auth State (Inlined)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<{
    type: 'idle' | 'typing' | 'signing-in' | 'success' | 'error' | 'info';
    message?: string;
  }>({ type: 'idle' });

  // Auth Handlers
  const handleSignUp = async () => {
    setAuthStatus({ type: 'signing-in', message: 'Creating account...' });
    const redirectTo = `${process.env.EXPO_PUBLIC_SITE_URL ?? 'http://localhost:8081'}/profile`;

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setAuthStatus({ type: 'error', message: error.message });
      return;
    }

    if (data?.session) {
      setAuthStatus({ type: 'success', message: 'Signed up and signed in.' });
    } else {
      setAuthStatus({ type: 'info', message: 'Check your email for a confirmation link.' });
    }
  };

  const handleSignIn = async () => {
    setAuthStatus({ type: 'signing-in', message: 'Signing in...' });
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) {
      setAuthStatus({ type: 'error', message: error.message });
      return;
    }
    setAuthStatus({ type: 'success', message: 'Signed in.' });
  };



// ... inside component

  useEffect(() => {
    if (user) {
      ProfileRepository.getProfile(user.id).then((data) => {
          if (data) {
            setUsername(data.username || '');
            setFullName(data.full_name || '');
            setTempUsername(data.username || '');
            setTempFullName(data.full_name || '');
          }
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    // Save locally first
    await ProfileRepository.saveProfile({
        id: user.id,
        email: user.email || '',
        username: tempUsername,
        full_name: tempFullName,
        updated_at: Date.now(),
        sync_status: 'pending'
    });
    
    setLoading(false);
    setUsername(tempUsername);
    setFullName(tempFullName);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancelEdit = () => {
    setTempUsername(username);
    setTempFullName(fullName);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
             if (!user) return;
             try {
               setLoading(true);
               const { error } = await supabase.functions.invoke('delete-account', {
                 body: { user_id: user.id }
               });
 
               if (error) throw error;
               
               await supabase.auth.signOut();
             } catch (error) {
               console.error('Delete account error:', error);
               Alert.alert("Error", "Failed to delete account. Please try again.");
             } finally {
               setLoading(false);
             }
          } 
        }
      ]
    );
  };

  if (!user) {
    return (
      <View className="flex-1 bg-light dark:bg-dark">
        <ScreenHeader 
          title="Profile" 
          leftAction={<BackButton />}
        />
        <View className="flex-1 justify-center px-4">
            <Text className="text-center text-lg font-bold mb-8 text-light dark:text-dark">
                Sign in to view your profile
            </Text>
            
            {/* Inlined Auth Form */}
             <View className="justify-center">
              <TextInput
                className="p-3 mb-4 border border-light rounded-lg bg-light-darker text-light dark:bg-dark-lighter dark:text-dark dark:border-dark"
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={authEmail}
                onChangeText={setAuthEmail}
                autoCapitalize="none"
              />
              <TextInput
                className="p-3 mb-4 border border-light rounded-lg bg-light-darker text-light dark:bg-dark-lighter dark:text-dark dark:border-dark"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={authPassword}
                onChangeText={(text) => {
                  setAuthPassword(text);
                  setAuthStatus((s) => (s.type === 'idle' ? { type: 'typing' } : s));
                }}
                secureTextEntry
                autoCapitalize="none"
              />
              {/* Status message */}
              {authStatus.type !== 'idle' && (
                <Text
                  className={
                    `mb-3 text-sm ` +
                    (authStatus.type === 'error'
                      ? 'text-red-600'
                      : authStatus.type === 'success'
                      ? 'text-green-600'
                      : authStatus.type === 'signing-in'
                      ? 'text-blue-600'
                      : 'text-light dark:text-dark')
                  }
                  accessibilityLiveRegion="polite"
                >
                  {authStatus.message ?? (authStatus.type === 'typing' ? 'Typing...' : '')}
                </Text>
              )}
              <RaisedButton title="Sign In" onPress={handleSignIn} className="h-12 my-2 w-full" />
              <RaisedButton title="Sign Up" onPress={handleSignUp} className="h-12 my-2 w-full" />
            </View>

        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader 
        title={username || 'Profile'} 
        leftAction={<BackButton />}
      />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-36 px-4 mb-6">
            <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-light dark:text-dark">Account</Text>
            {isEditing ? (
                <View className="flex-row gap-2">
                <RaisedButton 
                    onPress={handleCancelEdit} 
                    disabled={loading}
                    borderRadius={20}
                    className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center bg-gray-200 dark:bg-white/10"
                >
                    <IconSymbol name="xmark" size={18} color={theme.danger} />
                </RaisedButton>
                <RaisedButton 
                    onPress={handleUpdateProfile} 
                    disabled={loading}
                    borderRadius={20}
                    className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                >
                    <IconSymbol name="checkmark" size={18} color={theme.primary} />
                </RaisedButton>
                </View>
            ) : (
                <RaisedButton 
                onPress={() => setIsEditing(true)}
                borderRadius={20}
                className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                >
                <IconSymbol name="pencil" size={18} color={theme.primary} />
                </RaisedButton>
            )}
            </View>
            
            <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden p-4">
                <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                    <Text className="text-sm text-gray-500 font-medium">Email</Text>
                    <Text className="text-base text-gray-900 dark:text-white">{user?.email}</Text>
                </View>
                
                <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                    <Text className="text-sm text-gray-500 font-medium">Username</Text>
                    {isEditing ? (
                        <View 
                        className="h-8 bg-black/5 dark:bg-white/5 rounded-lg border border-transparent min-w-[150px] justify-center pr-1"
                        >
                        <TextInput
                            className="text-base text-gray-900 dark:text-white text-right leading-none"
                            style={{ paddingTop: 0, paddingBottom: 0, height: '100%' }}
                            value={tempUsername}
                            onChangeText={setTempUsername}
                            placeholder="Username"
                            placeholderTextColor={theme.placeholder}
                            autoCapitalize="none"
                        />
                        </View>
                    ) : (
                        <Text className="h-8 text-base text-gray-900 dark:text-white pr-1 pt-1">{username || 'Not set'}</Text>
                    )}
                </View>

                <View className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-gray-500 font-medium">Full Name</Text>
                    {isEditing ? (
                        <View 
                        className="h-8 bg-black/5 dark:bg-white/5 rounded-lg border border-transparent min-w-[150px] justify-center pr-1"
                        >
                        <TextInput
                            className="text-base text-gray-900 dark:text-white text-right leading-none"
                            style={{ paddingTop: 0, paddingBottom: 0, height: '100%' }}
                            value={tempFullName}
                            onChangeText={setTempFullName}
                            placeholder="Full Name"
                            placeholderTextColor={theme.placeholder}
                        />
                        </View>
                    ) : (
                        <Text className="h-8 text-base text-gray-900 dark:text-white pr-1 pt-1">{fullName || 'Not set'}</Text>
                    )}
                </View>
            </View>
        </View>

        <View className="px-4">
            <RaisedButton 
            title="Sign Out" 
            onPress={handleSignOut} 
            className="mb-4 h-12 w-full"
            />
            
            <RaisedButton 
            title="Delete Account" 
            onPress={handleDeleteAccount} 
            className="h-12 w-full"
            textClassName="text-red-500 font-bold text-lg"
            />
            
            <Text className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4 mb-2">
                Last synced: {lastSyncedAt ? lastSyncedAt.toLocaleString() : 'Never'}
            </Text>

            <RaisedButton
                title={isSyncing ? "Syncing..." : "Sync Now"}
                onPress={sync}
                disabled={isSyncing}
                className="h-10 w-full bg-gray-200 dark:bg-gray-800"
                textClassName="text-sm font-medium text-gray-900 dark:text-gray-100"
            />
        </View>
      </ScrollView>
    </View>
  );
}