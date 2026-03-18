import { View, ScrollView, Text } from 'react-native';
import { useUITheme, RaisedCard, IconSymbol } from '@mysuite/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

export default function ProfileScreen() {
  const theme = useUITheme();

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader
        title="Profile"
        leftAction={<BackButton />}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 140 }}>
        <RaisedCard className="mb-6 p-5">
          <View className="items-center mb-4">
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: theme.primary + '22',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <IconSymbol name="person.fill" size={32} color={theme.primary} />
            </View>
            <Text className="text-lg font-bold text-light dark:text-dark">Guest</Text>
            <Text className="text-sm text-gray-500 mt-1">Local mode — data saved on this device</Text>
          </View>
        </RaisedCard>

        <RaisedCard className="p-4">
          <View className="flex-row items-center gap-3">
            <IconSymbol name="info.circle" size={20} color={theme.primary} />
            <View className="flex-1">
              <Text className="text-base font-semibold text-light dark:text-dark">All data is local</Text>
              <Text className="text-sm text-gray-500 mt-0.5">
                Your workouts, history, and measurements are stored only on this device.
              </Text>
            </View>
          </View>
        </RaisedCard>
      </ScrollView>
    </View>
  );
}