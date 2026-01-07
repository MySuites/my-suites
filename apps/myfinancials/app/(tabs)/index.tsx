import { View, StyleSheet, Text } from 'react-native';
import { RaisedCard } from '@mysuite/ui';

export default function HomeScreen() {
  return (
    <View className="bg-light dark:bg-dark" style={styles.container}>
      <Text className="text-3xl font-bold leading-8 text-light dark:text-dark">Tab One</Text>
      <RaisedCard className="p-4 bg-primary dark:bg-primary-dark rounded-full items-center justify-center">
        <Text className="text-white font-bold">This is a v4 NativeWind button!</Text>
      </RaisedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
